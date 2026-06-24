import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { MonHocBangDiem, MucQuyDoiDiem, ThanhPhanDiem } from "../../domain/grade.js";
import type { KhoDiemSo } from "../ports/grade.repository.js";
import type { DichVuGhiLogLoiDiemSo } from "../services/grade-error-logger.service.js";
import { lapBangDiemTuDuLieu, SAI_SO_TRONG_SO } from "./grade-use-case.helpers.js";

export type LenhDuPhongGpa = {
  actorId: string;
  maHocKy?: string | null;
  targetGpa?: number | null;
};

type PhuThuoc = {
  khoDiemSo: KhoDiemSo;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuGhiLogLoiDiemSo: DichVuGhiLogLoiDiemSo;
};

type KetQuaGoiYDiemThanhPhan = {
  maThanhPhan: string;
  tenThanhPhan: string;
  trongSo: number;
  diemHienTai: number | null;
  diemCanDat: number;
};

const lamTron = (value: number, digits = 2) => Number(value.toFixed(digits));

export class XuLyDuPhongGpa {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDuPhongGpa) {
    const { maHocKy, targetGpa } = await this.kiemTraDauVao(command);

    try {
      const hocKy = await this.deps.khoDiemSo.timHocKyCuaSinhVien(maHocKy, command.actorId);

      if (!hocKy) {
        await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
          actorId: command.actorId,
          action: "GRADE_GPA_PROJECTION_SEMESTER_FORBIDDEN",
          tableName: "hoc_ky",
          message: "Sinh viên dự phóng GPA thất bại vì học kỳ không thuộc tài khoản",
          metadata: {
            maHocKy,
            targetGpa
          }
        });
        throw LoiUngDung.khongCoQuyen("Học kỳ dự phóng không thuộc sinh viên");
      }

      const monHoc = await this.deps.khoDiemSo.lietKeMonHocBangDiem({
        actorId: command.actorId,
        maHocKy
      });

      if (monHoc.length === 0) {
        await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
          actorId: command.actorId,
          action: "GRADE_GPA_PROJECTION_NO_COURSES_IN_SEMESTER",
          tableName: "mon_hoc",
          message: "Sinh viên dự phóng GPA thất bại vì học kỳ chưa có môn học",
          metadata: {
            maHocKy,
            tenHocKy: hocKy.tenHocKy,
            targetGpa
          }
        });
        throw LoiUngDung.khongTheXuLy("Học kỳ này chưa có môn học nào, vui lòng thêm môn học trước khi dự phóng GPA");
      }

      const maTruongCode = await this.deps.khoDiemSo.layMaTruongCodeSinhVien(command.actorId);

      if (!maTruongCode) {
        await this.ghiCanhBaoThieuCauHinh(command.actorId, maHocKy, targetGpa, "GRADE_GPA_PROJECTION_SCHOOL_PROFILE_MISSING", {
          reasonCode: "SCHOOL_PROFILE_MISSING"
        });
        throw LoiUngDung.khongTheXuLy("Không thể dự phóng GPA do hệ thống chưa xác định được trường học của sinh viên");
      }

      const [thangDiem, quyCheHocLuc] = await Promise.all([
        this.deps.khoDiemSo.layThangDiem(maTruongCode),
        this.deps.khoDiemSo.layQuyCheHocLuc(maTruongCode)
      ]);

      if (thangDiem.length === 0 || quyCheHocLuc.length === 0) {
        await this.ghiCanhBaoThieuCauHinh(command.actorId, maHocKy, targetGpa, "GRADE_GPA_PROJECTION_RULES_MISSING", {
          maTruongCode,
          hasScoreScale: thangDiem.length > 0,
          hasStandingRules: quyCheHocLuc.length > 0
        });
        throw LoiUngDung.khongTheXuLy("Hệ thống chưa thiết lập cấu hình thang điểm cho trường học này");
      }

      const thanhPhanTheoMon = new Map(
        await Promise.all(
          monHoc.map(async (item) => [item.maMonHoc, await this.deps.khoDiemSo.lietKeThanhPhanTheoMon(item.maMonHoc)] as const)
        )
      );

      await this.kiemTraTrongSoDaCauHinh(command.actorId, maHocKy, targetGpa, monHoc, thanhPhanTheoMon);

      const bangDiem = lapBangDiemTuDuLieu(monHoc, thanhPhanTheoMon, thangDiem, quyCheHocLuc);
      const monDaHoanThanh = bangDiem.items.filter((item) => item.ketQua.diemHe4 !== null && item.ketQua.dayDuDiem);
      const monChuaHoanThanh = bangDiem.items.filter((item) => item.ketQua.diemHe4 === null || !item.ketQua.dayDuDiem);
      const tongTinChi = bangDiem.items.reduce((tong, item) => tong + item.soTinChi, 0);

      if (tongTinChi === 0) {
        await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
          actorId: command.actorId,
          action: "GRADE_GPA_PROJECTION_NO_CREDIT",
          tableName: "mon_hoc",
          message: "Sinh viên dự phóng GPA thất bại vì học kỳ không có số tín chỉ hợp lệ",
          metadata: {
            maHocKy,
            targetGpa
          }
        });
        throw LoiUngDung.khongTheXuLy("Học kỳ này chưa có môn học có số tín chỉ hợp lệ để dự phóng GPA");
      }

      const tongDiemHe4MucTieu = targetGpa * tongTinChi;
      const diemHe4DaCo = monDaHoanThanh.reduce((tong, item) => tong + (item.ketQua.diemHe4 ?? 0) * item.soTinChi, 0);
      const soTinChiDaHoanThanh = monDaHoanThanh.reduce((tong, item) => tong + item.soTinChi, 0);
      const soTinChiConLai = monChuaHoanThanh.reduce((tong, item) => tong + item.soTinChi, 0);
      const diemHe4ConLai = tongDiemHe4MucTieu - diemHe4DaCo;
      const gpaToiDaCoTheDat = lamTron((diemHe4DaCo + soTinChiConLai * 4) / tongTinChi);

      if (targetGpa > gpaToiDaCoTheDat + 0.005) {
        await this.ghiCanhBaoKhongKhaThi(command.actorId, maHocKy, targetGpa, {
          reasonCode: "TARGET_GREATER_THAN_MAX_GPA",
          gpaToiDaCoTheDat,
          soTinChiDaHoanThanh,
          soTinChiConLai
        });
        throw LoiUngDung.khongTheXuLy(
          `Mục tiêu vượt quá khả năng tích lũy tối đa. Tối đa bạn có thể đạt ${gpaToiDaCoTheDat.toFixed(2)}. Vui lòng đặt mục tiêu thấp hơn.`,
          { targetGpa, gpaToiDaCoTheDat }
        );
      }

      if (soTinChiConLai === 0) {
        await this.ghiLogDuPhongThanhCong(command.actorId, maHocKy, targetGpa, {
          tongTinChi,
          tongDiemHe4MucTieu: lamTron(tongDiemHe4MucTieu),
          diemHe4DaCo: lamTron(diemHe4DaCo),
          soTinChiDaHoanThanh,
          soTinChiConLai,
          status: "ALL_COURSES_COMPLETED"
        });

        return {
          message: "Mục tiêu GPA hiện đã đạt được với dữ liệu điểm hiện tại.",
          maHocKy,
          targetGpa,
          tongTinChi,
          tongDiemHe4MucTieu: lamTron(tongDiemHe4MucTieu),
          diemHe4DaCo: lamTron(diemHe4DaCo),
          soTinChiDaHoanThanh,
          soTinChiConLai,
          gpaHienTai: bangDiem.tongKet.gpaHocKy,
          gpaToiDaCoTheDat,
          diemHe4CanDatMoiTinChi: 0,
          goiY: []
        };
      }

      const diemHe4CanDatMoiTinChi = diemHe4ConLai / soTinChiConLai;

      if (diemHe4CanDatMoiTinChi > 4 + 0.005) {
        await this.ghiCanhBaoKhongKhaThi(command.actorId, maHocKy, targetGpa, {
          reasonCode: "REMAINING_CREDIT_TARGET_GREATER_THAN_4",
          diemHe4CanDatMoiTinChi: lamTron(diemHe4CanDatMoiTinChi),
          soTinChiConLai
        });
        throw LoiUngDung.khongTheXuLy(
          "Mục tiêu GPA học kỳ không khả thi với số tín chỉ và điểm hiện tại. Vui lòng hạ mục tiêu GPA học kỳ xuống.",
          { targetGpa, diemHe4CanDatMoiTinChi: lamTron(diemHe4CanDatMoiTinChi) }
        );
      }

      const mucDiemCanDat =
        diemHe4CanDatMoiTinChi <= 0 ? null : this.timMucQuyDoiTheoHe4(diemHe4CanDatMoiTinChi, thangDiem);

      if (diemHe4CanDatMoiTinChi > 0 && !mucDiemCanDat) {
        await this.ghiCanhBaoThieuCauHinh(command.actorId, maHocKy, targetGpa, "GRADE_GPA_PROJECTION_SCORE_SCALE_NO_MATCH", {
          maTruongCode,
          diemHe4CanDatMoiTinChi: lamTron(diemHe4CanDatMoiTinChi)
        });
        throw LoiUngDung.khongTheXuLy("Không tìm được mốc thang điểm phù hợp để dự phóng GPA cho mục tiêu này");
      }

      const diemHe10ToiThieu = mucDiemCanDat ? mucDiemCanDat.diemTu : 0;
      const goiY = this.taoGoiYDiemThanhPhan(monChuaHoanThanh, thanhPhanTheoMon, diemHe10ToiThieu, mucDiemCanDat);
      const monKhongKhaThi = goiY.filter((item) => !item.khaThi);

      if (monKhongKhaThi.length > 0) {
        await this.ghiCanhBaoKhongKhaThi(command.actorId, maHocKy, targetGpa, {
          reasonCode: "COURSE_COMPONENT_TARGET_GREATER_THAN_10",
          monKhongKhaThi: monKhongKhaThi.map((item) => ({
            maMonHoc: item.maMonHoc,
            tenMon: item.tenMon,
            diemCanDat: item.diemThanhPhanCanDat
          }))
        });
        throw LoiUngDung.khongTheXuLy(
          "Mục tiêu GPA học kỳ không khả thi với các điểm thành phần hiện tại. Vui lòng hạ mục tiêu GPA học kỳ xuống.",
          { targetGpa, monKhongKhaThi }
        );
      }

      await this.ghiLogDuPhongThanhCong(command.actorId, maHocKy, targetGpa, {
        tongTinChi,
        tongDiemHe4MucTieu: lamTron(tongDiemHe4MucTieu),
        diemHe4DaCo: lamTron(diemHe4DaCo),
        diemHe4ConLai: lamTron(diemHe4ConLai),
        soTinChiDaHoanThanh,
        soTinChiConLai,
        diemHe4CanDatMoiTinChi: lamTron(Math.max(0, diemHe4CanDatMoiTinChi)),
        diemHe10ToiThieu,
        diemChuDuKien: mucDiemCanDat?.diemChu ?? null
      });

      return {
        message: `Để đạt GPA mục tiêu ${targetGpa.toFixed(2)}, bạn cần đạt tối thiểu các mức điểm sau.`,
        maHocKy,
        targetGpa,
        tongTinChi,
        tongDiemHe4MucTieu: lamTron(tongDiemHe4MucTieu),
        diemHe4DaCo: lamTron(diemHe4DaCo),
        diemHe4ConLai: lamTron(diemHe4ConLai),
        soTinChiDaHoanThanh,
        soTinChiConLai,
        gpaHienTai: bangDiem.tongKet.gpaHocKy,
        gpaToiDaCoTheDat,
        diemHe4CanDatMoiTinChi: lamTron(Math.max(0, diemHe4CanDatMoiTinChi)),
        diemHe10ToiThieu,
        diemChuDuKien: mucDiemCanDat?.diemChu ?? null,
        goiY
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiDiemSo.ghi({
        actorId: command.actorId,
        action: "GRADE_GPA_PROJECTION_FAILED",
        tableName: "thanh_phan_diem",
        message: "Lỗi dự phóng GPA mục tiêu",
        error,
        metadata: {
          maHocKy,
          targetGpa
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể dự phóng GPA lúc này");
    }
  }

  private async kiemTraDauVao(command: LenhDuPhongGpa) {
    const loi: string[] = [];

    if (!command.maHocKy) {
      loi.push("Cần chọn học kỳ trước khi dự phóng GPA");
    }

    if (typeof command.targetGpa !== "number" || !Number.isFinite(command.targetGpa) || command.targetGpa < 0 || command.targetGpa > 4) {
      loi.push("GPA mục tiêu phải thuộc khoảng từ 0.0 đến 4.0");
    }

    if (loi.length > 0) {
      await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
        actorId: command.actorId,
        action: "GRADE_GPA_PROJECTION_VALIDATION_FAILED",
        tableName: "thanh_phan_diem",
        message: "Sinh viên dự phóng GPA thất bại vì dữ liệu đầu vào sai định dạng",
        metadata: {
          maHocKy: command.maHocKy ?? null,
          targetGpa: command.targetGpa,
          errors: loi
        }
      });
      throw LoiUngDung.yeuCauSai(loi[0], loi);
    }

    return {
      maHocKy: command.maHocKy as string,
      targetGpa: command.targetGpa as number
    };
  }

  private async kiemTraTrongSoDaCauHinh(
    actorId: string,
    maHocKy: string,
    targetGpa: number,
    monHoc: Array<{ maMonHoc: string; tenMon: string }>,
    thanhPhanTheoMon: Map<string, ThanhPhanDiem[]>
  ) {
    for (const mon of monHoc) {
      const thanhPhan = thanhPhanTheoMon.get(mon.maMonHoc) ?? [];
      const tongTrongSo = thanhPhan.reduce((tong, item) => tong + item.trongSo, 0);

      if (thanhPhan.length === 0 || Math.abs(tongTrongSo - 100) >= SAI_SO_TRONG_SO) {
        const message = `Môn học [${mon.tenMon}] chưa được cấu hình tỷ lệ điểm (Trọng số). Hãy vào chi tiết môn học để cài đặt trước khi dự phóng.`;

        await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
          actorId,
          action: "GRADE_GPA_PROJECTION_WEIGHT_MISSING",
          tableName: "thanh_phan_diem",
          message: "Sinh viên dự phóng GPA thất bại vì môn học chưa cấu hình đủ trọng số điểm",
          metadata: {
            maHocKy,
            targetGpa,
            maMonHoc: mon.maMonHoc,
            tenMon: mon.tenMon,
            tongTrongSo,
            soThanhPhan: thanhPhan.length
          }
        });
        throw LoiUngDung.khongTheXuLy(message, {
          maHocKy,
          maMonHoc: mon.maMonHoc,
          tenMon: mon.tenMon,
          tongTrongSo
        });
      }
    }
  }

  private timMucQuyDoiTheoHe4(he4MucTieu: number, thangDiem: MucQuyDoiDiem[]) {
    return (
      thangDiem
        .filter((item) => item.he4 >= he4MucTieu)
        .sort((a, b) => a.he4 - b.he4 || a.diemTu - b.diemTu)[0] ?? null
    );
  }

  private taoGoiYDiemThanhPhan(
    monChuaHoanThanh: MonHocBangDiem[],
    thanhPhanTheoMon: Map<string, ThanhPhanDiem[]>,
    diemHe10ToiThieu: number,
    mucDiemCanDat: MucQuyDoiDiem | null
  ) {
    return monChuaHoanThanh.map((item) => {
      const thanhPhan = thanhPhanTheoMon.get(item.maMonHoc) ?? [];
      const thanhPhanDaCoDiem = thanhPhan.filter((component) => component.diem !== null);
      const thanhPhanConThieu = thanhPhan.filter((component) => component.diem === null);
      const diemDaCo = thanhPhanDaCoDiem.reduce((tong, component) => tong + (component.diem ?? 0) * (component.trongSo / 100), 0);
      const tongTrongSoConThieu = thanhPhanConThieu.reduce((tong, component) => tong + component.trongSo / 100, 0);
      const diemCanBu = diemHe10ToiThieu - diemDaCo;
      const diemThanhPhanCanDat =
        thanhPhanConThieu.length > 0 && tongTrongSoConThieu > 0 ? lamTron(diemCanBu / tongTrongSoConThieu) : 0;
      const diemCanDatHienThi = Math.max(0, diemThanhPhanCanDat);
      const thanhPhanCanDat = this.taoGoiYChoThanhPhanConThieu(thanhPhanConThieu, diemCanDatHienThi);
      const khaThi = diemThanhPhanCanDat <= 10;

      return {
        maMonHoc: item.maMonHoc,
        maMon: item.maMon,
        tenMon: item.tenMon,
        soTinChi: item.soTinChi,
        diemHe10ToiThieu,
        diemChuDuKien: mucDiemCanDat?.diemChu ?? null,
        diemHe4DuKien: mucDiemCanDat?.he4 ?? null,
        diemDaCo: lamTron(diemDaCo),
        tongTrongSoConThieu: lamTron(tongTrongSoConThieu * 100),
        diemCanBu: lamTron(Math.max(0, diemCanBu)),
        diemThanhPhanCanDat: diemCanDatHienThi,
        khaThi,
        trangThai:
          diemThanhPhanCanDat <= 0
            ? "DA_DU_AN_TOAN"
            : khaThi
              ? "CAN_DAT_DIEM_CON_THIEU"
              : "KHONG_KHA_THI",
        thanhPhanCanDat,
        thanhPhanDaCoDiem: thanhPhanDaCoDiem.map((component) => ({
          maThanhPhan: component.maThanhPhan,
          tenThanhPhan: component.tenThanhPhan,
          trongSo: component.trongSo,
          diem: component.diem
        }))
      };
    });
  }

  private taoGoiYChoThanhPhanConThieu(thanhPhanConThieu: ThanhPhanDiem[], diemCanDat: number): KetQuaGoiYDiemThanhPhan[] {
    return thanhPhanConThieu.map((component) => ({
      maThanhPhan: component.maThanhPhan,
      tenThanhPhan: component.tenThanhPhan,
      trongSo: component.trongSo,
      diemHienTai: component.diem,
      diemCanDat: lamTron(diemCanDat)
    }));
  }

  private async ghiLogDuPhongThanhCong(
    actorId: string,
    maHocKy: string,
    targetGpa: number,
    metadata: Record<string, unknown>
  ) {
    await this.deps.khoNhatKyHeThong.tao({
      actorId,
      level: "INFO",
      action: "GRADE_GPA_PROJECTED",
      tableName: "thanh_phan_diem",
      recordId: maHocKy,
      message: "Sinh viên thực hiện giả định dự phóng GPA mục tiêu thành công",
      metadata: {
        maHocKy,
        targetGpa,
        ruleCodes: ["BR-EDU-03", "BR-EDU-04"],
        ...metadata
      }
    });
  }

  private async ghiCanhBaoKhongKhaThi(
    actorId: string,
    maHocKy: string,
    targetGpa: number,
    metadata: Record<string, unknown>
  ) {
    await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
      actorId,
      action: "GRADE_GPA_PROJECTION_NOT_FEASIBLE",
      tableName: "thanh_phan_diem",
      message: "Sinh viên dự phóng GPA thất bại vì mục tiêu không khả thi",
      metadata: {
        maHocKy,
        targetGpa,
        ...metadata
      }
    });
  }

  private async ghiCanhBaoThieuCauHinh(
    actorId: string,
    maHocKy: string,
    targetGpa: number,
    action: string,
    metadata: Record<string, unknown>
  ) {
    await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
      actorId,
      action,
      tableName: "thanh_phan_diem",
      message: "Sinh viên dự phóng GPA thất bại do thiếu cấu hình học thuật",
      metadata: {
        maHocKy,
        targetGpa,
        ...metadata
      }
    });
  }
}
