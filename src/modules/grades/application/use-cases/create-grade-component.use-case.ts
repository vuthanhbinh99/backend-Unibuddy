import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KetQuaTinhMonHoc, ThanhPhanDiem } from "../../domain/grade.js";
import type { KhoDiemSo } from "../ports/grade.repository.js";
import { tinhKetQuaMonHoc } from "../services/grade-calculation.service.js";
import type { DichVuGhiLogLoiDiemSo } from "../services/grade-error-logger.service.js";
import { chuanHoaTenThanhPhan, laDiemHopLe, laTrongSoHopLe } from "./grade-use-case.helpers.js";

export type LenhTaoThanhPhanDiem = {
  actorId: string;
  maMonHoc?: string | null;
  tenThanhPhan?: string | null;
  trongSo?: number | null;
  diem?: number | null;
};

type PhuThuoc = {
  khoDiemSo: KhoDiemSo;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiDiemSo: DichVuGhiLogLoiDiemSo;
};

export class XuLyTaoThanhPhanDiem {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoThanhPhanDiem) {
    const duLieuHopLe = await this.chuanHoaVaKiemTra(command);
    const monHoc = await this.deps.khoDiemSo.timMonHocCuaSinhVien(duLieuHopLe.maMonHoc, command.actorId);

    if (!monHoc) {
      await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
        actorId: command.actorId,
        action: "GRADE_COMPONENT_COURSE_FORBIDDEN",
        tableName: "thanh_phan_diem",
        message: "Sinh viên nhập điểm thất bại vì môn học không thuộc tài khoản",
        metadata: {
          maMonHoc: duLieuHopLe.maMonHoc,
          tenThanhPhan: duLieuHopLe.tenThanhPhan
        }
      });
      throw LoiUngDung.khongCoQuyen("Không thể nhập điểm cho môn học không thuộc sinh viên");
    }

    const thanhPhanHienTai = await this.deps.khoDiemSo.timThanhPhanTheoTen(
      duLieuHopLe.maMonHoc,
      duLieuHopLe.tenThanhPhan
    );

    if (thanhPhanHienTai?.diem !== null && thanhPhanHienTai?.diem !== undefined) {
      await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
        actorId: command.actorId,
        action: "GRADE_COMPONENT_CONFLICT",
        tableName: "thanh_phan_diem",
        recordId: thanhPhanHienTai.maThanhPhan,
        message: "Sinh viên nhập điểm thất bại vì đầu điểm đã tồn tại",
        metadata: {
          maMonHoc: duLieuHopLe.maMonHoc,
          tenThanhPhan: duLieuHopLe.tenThanhPhan
        }
      });
      throw LoiUngDung.xungDot("Đầu điểm thành phần này của môn học đã tồn tại");
    }

    try {
      const thanhPhan = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const ketQua = thanhPhanHienTai
          ? await this.deps.khoDiemSo.capNhatDiem(thanhPhanHienTai.maThanhPhan, duLieuHopLe.diem, tx)
          : await this.deps.khoDiemSo.taoThanhPhan(duLieuHopLe, tx);

        if (!ketQua) {
          throw new Error("Không thể lưu thành phần điểm");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "GRADE_COMPONENT_CREATED",
            tableName: "thanh_phan_diem",
            recordId: ketQua.maThanhPhan,
            message: "Sinh viên nhập mới điểm số thành phần thành công",
            metadata: {
              maMonHoc: monHoc.maMonHoc,
              maMon: monHoc.maMon,
              tenMon: monHoc.tenMon,
              tenThanhPhan: ketQua.tenThanhPhan,
              trongSo: ketQua.trongSo,
              diem: ketQua.diem,
              daCoCauHinhTrongSo: Boolean(thanhPhanHienTai),
              ruleCode: "BR-EDU-03"
            }
          },
          tx
        );

        return ketQua;
      });

      return {
        message: "Nhập điểm và cập nhật tổng kết môn học thành công!",
        thanhPhan,
        ketQuaMonHoc: await this.tinhKetQuaMonHoc(command.actorId, monHoc.maMonHoc)
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiDiemSo.ghi({
        actorId: command.actorId,
        action: "GRADE_COMPONENT_CREATE_FAILED",
        tableName: "thanh_phan_diem",
        message: "Lỗi lưu điểm thành phần vào database",
        error,
        metadata: {
          maMonHoc: duLieuHopLe.maMonHoc,
          tenThanhPhan: duLieuHopLe.tenThanhPhan,
          diem: duLieuHopLe.diem
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể nhập điểm lúc này");
    }
  }

  private async chuanHoaVaKiemTra(command: LenhTaoThanhPhanDiem) {
    const maMonHoc = command.maMonHoc?.trim() ?? "";
    const tenThanhPhan = chuanHoaTenThanhPhan(command.tenThanhPhan);
    const diem = command.diem;
    const trongSo = command.trongSo;
    const errors: string[] = [];

    if (!maMonHoc) {
      errors.push("Mã môn học không được để trống");
    }

    if (!tenThanhPhan) {
      errors.push("Tên thành phần điểm không được để trống");
    }

    if (!laDiemHopLe(diem)) {
      errors.push("Điểm số phải là số thực từ 0 đến 10");
    }

    if (trongSo !== null && trongSo !== undefined && !laTrongSoHopLe(trongSo)) {
      errors.push("Trọng số phải lớn hơn 0 và không vượt quá 100");
    }

    if (errors.length > 0 || !laDiemHopLe(diem)) {
      await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
        actorId: command.actorId,
        action: "GRADE_COMPONENT_CREATE_VALIDATION_FAILED",
        tableName: "thanh_phan_diem",
        message: "Sinh viên nhập điểm thất bại do dữ liệu không hợp lệ",
        metadata: {
          errors,
          maMonHoc: maMonHoc || null,
          tenThanhPhan: tenThanhPhan || null,
          diem
        }
      });
      throw LoiUngDung.yeuCauSai("Điểm số phải là số thực từ 0 đến 10", errors);
    }

    return {
      maMonHoc,
      tenThanhPhan,
      trongSo: laTrongSoHopLe(trongSo) ? trongSo : 100,
      diem
    };
  }

  private async tinhKetQuaMonHoc(actorId: string, maMonHoc: string): Promise<KetQuaTinhMonHoc> {
    const [thanhPhan, maTruongCode] = await Promise.all([
      this.deps.khoDiemSo.lietKeThanhPhanTheoMon(maMonHoc),
      this.deps.khoDiemSo.layMaTruongCodeSinhVien(actorId)
    ]);
    const thangDiem = maTruongCode ? await this.deps.khoDiemSo.layThangDiem(maTruongCode) : [];

    return tinhKetQuaMonHoc(thanhPhan as ThanhPhanDiem[], thangDiem);
  }
}
