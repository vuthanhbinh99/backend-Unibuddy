import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { CauHinhTrongSoDiem, KetQuaTinhMonHoc, ThanhPhanDiem } from "../../domain/grade.js";
import type { KhoDiemSo } from "../ports/grade.repository.js";
import { tinhKetQuaMonHoc } from "../services/grade-calculation.service.js";
import type { DichVuGhiLogLoiDiemSo } from "../services/grade-error-logger.service.js";
import {
  SAI_SO_TRONG_SO,
  chuanHoaTenThanhPhan,
  laDiemHopLe,
  laTrongSoHopLe
} from "./grade-use-case.helpers.js";

export type LenhCauHinhTrongSoDiem = {
  actorId: string;
  maMonHoc?: string | null;
  components?: Array<{
    tenThanhPhan?: string | null;
    trongSo?: number | null;
    diem?: number | null;
  }> | null;
};

type PhuThuoc = {
  khoDiemSo: KhoDiemSo;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiDiemSo: DichVuGhiLogLoiDiemSo;
};

export class XuLyCauHinhTrongSoDiem {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCauHinhTrongSoDiem) {
    const duLieuHopLe = await this.chuanHoaVaKiemTra(command);
    const monHoc = await this.deps.khoDiemSo.timMonHocCuaSinhVien(duLieuHopLe.maMonHoc, command.actorId);

    if (!monHoc) {
      await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
        actorId: command.actorId,
        action: "GRADE_WEIGHT_COURSE_FORBIDDEN",
        tableName: "thanh_phan_diem",
        message: "Sinh viên cấu hình trọng số thất bại vì môn học không thuộc tài khoản",
        metadata: {
          maMonHoc: duLieuHopLe.maMonHoc
        }
      });
      throw LoiUngDung.khongCoQuyen("Không thể cấu hình trọng số cho môn học không thuộc sinh viên");
    }

    try {
      const thanhPhan = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const daLuu = await this.deps.khoDiemSo.thayTheCauHinhTrongSo(
          duLieuHopLe.maMonHoc,
          duLieuHopLe.components,
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "GRADE_WEIGHT_CONFIGURED",
            tableName: "thanh_phan_diem",
            recordId: duLieuHopLe.maMonHoc,
            message: "Sinh viên thiết lập trọng số điểm môn học thành công",
            metadata: {
              maMonHoc: monHoc.maMonHoc,
              maMon: monHoc.maMon,
              tenMon: monHoc.tenMon,
              soThanhPhan: daLuu.length,
              tongTrongSo: duLieuHopLe.components.reduce((tong, item) => tong + item.trongSo, 0),
              ruleCode: "BR-EDU-02"
            }
          },
          tx
        );

        return daLuu;
      });

      return {
        message: "Cấu hình cấu trúc phần trăm điểm thành công!",
        thanhPhan,
        ketQuaMonHoc: await this.tinhKetQuaMonHoc(command.actorId, monHoc.maMonHoc)
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiDiemSo.ghi({
        actorId: command.actorId,
        action: "GRADE_WEIGHT_CONFIGURE_FAILED",
        tableName: "thanh_phan_diem",
        message: "Lỗi lưu cấu hình trọng số điểm môn học",
        error,
        metadata: {
          maMonHoc: duLieuHopLe.maMonHoc,
          soThanhPhan: duLieuHopLe.components.length
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể cấu hình trọng số lúc này");
    }
  }

  private async chuanHoaVaKiemTra(command: LenhCauHinhTrongSoDiem) {
    const maMonHoc = command.maMonHoc?.trim() ?? "";
    const components = command.components ?? [];
    const errors: string[] = [];
    const daGapTen = new Set<string>();
    const duLieuComponents: CauHinhTrongSoDiem[] = [];

    if (!maMonHoc) {
      errors.push("Mã môn học không được để trống");
    }

    if (components.length === 0) {
      errors.push("Cần có ít nhất một thành phần điểm");
    }

    for (const [index, item] of components.entries()) {
      const tenThanhPhan = chuanHoaTenThanhPhan(item.tenThanhPhan);
      const tenChuanHoa = tenThanhPhan.toLowerCase();

      if (!tenThanhPhan) {
        errors.push(`Dòng ${index + 1}: Tên thành phần điểm không được để trống`);
      } else if (daGapTen.has(tenChuanHoa)) {
        errors.push(`Dòng ${index + 1}: Tên thành phần điểm bị trùng`);
      }

      if (!laTrongSoHopLe(item.trongSo)) {
        errors.push(`Dòng ${index + 1}: Trọng số phải lớn hơn 0 và không vượt quá 100`);
      }

      if (item.diem !== undefined && item.diem !== null && !laDiemHopLe(item.diem)) {
        errors.push(`Dòng ${index + 1}: Điểm số phải từ 0 đến 10`);
      }

      if (tenThanhPhan && laTrongSoHopLe(item.trongSo)) {
        daGapTen.add(tenChuanHoa);
        duLieuComponents.push({
          tenThanhPhan,
          trongSo: item.trongSo,
          diem: item.diem ?? undefined
        });
      }
    }

    const tongTrongSo = duLieuComponents.reduce((tong, item) => tong + item.trongSo, 0);

    if (Math.abs(tongTrongSo - 100) >= SAI_SO_TRONG_SO) {
      await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
        actorId: command.actorId,
        action: "GRADE_WEIGHT_TOTAL_INVALID",
        tableName: "thanh_phan_diem",
        message: "Sinh viên cấu hình trọng số thất bại vì tổng trọng số không bằng 100%",
        metadata: {
          maMonHoc: maMonHoc || null,
          tongTrongSo,
          ruleCode: "BR-EDU-02"
        }
      });
      throw LoiUngDung.khongTheXuLy("Tổng trọng số phải bằng 100%", { tongTrongSo, ruleCode: "BR-EDU-02" });
    }

    if (errors.length > 0) {
      await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
        actorId: command.actorId,
        action: "GRADE_WEIGHT_VALIDATION_FAILED",
        tableName: "thanh_phan_diem",
        message: "Sinh viên cấu hình trọng số thất bại do dữ liệu không hợp lệ",
        metadata: {
          maMonHoc: maMonHoc || null,
          errors
        }
      });
      throw LoiUngDung.yeuCauSai("Vui lòng kiểm tra cấu hình trọng số điểm", errors);
    }

    return {
      maMonHoc,
      components: duLieuComponents
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
