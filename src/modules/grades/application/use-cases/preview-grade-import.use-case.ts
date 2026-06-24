import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type {
  DongImportDiemSo,
  DongPreviewImportDiemSo,
  DuLieuImportDiemSo,
  MappingCotImportDiemSo
} from "../../domain/grade.js";
import type { KhoDiemSo } from "../ports/grade.repository.js";
import type { DichVuGhiLogLoiDiemSo } from "../services/grade-error-logger.service.js";
import type {
  DichVuMappingImportDiemSo,
  DongImportDiemDaChuanHoa
} from "../services/grade-import-mapper.service.js";
import {
  boSungHuongDanNhapThuCongDiemSo,
  taoChiTietImportDiemThatBaiChoNhapThuCong,
  taoThongTinThemMonHocChoImportDiem,
  THONG_BAO_IMPORT_DIEM_THIEU_MON_HOC,
  taoThongTinNhapThuCongDiemSo
} from "../services/grade-import-manual-fallback.service.js";
import { hocKyDaKetThuc, laUuid } from "./grade-use-case.helpers.js";

export type LenhPreviewImportDiemSo = {
  actorId: string;
  maHocKy?: string | null;
  rows: DongImportDiemSo[];
  mapping: MappingCotImportDiemSo;
};

type PhuThuoc = {
  khoDiemSo: KhoDiemSo;
  dichVuMappingImportDiemSo: DichVuMappingImportDiemSo;
  dichVuGhiLogLoiDiemSo: DichVuGhiLogLoiDiemSo;
};

export class XuLyPreviewImportDiemSo {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhPreviewImportDiemSo) {
    try {
      return await this.taoPreview(command);
    } catch (error) {
      if (error instanceof LoiUngDung) {
        await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
          actorId: command.actorId,
          action: "GRADE_IMPORT_PREVIEW_REJECTED",
          tableName: "thanh_phan_diem",
          message: "Sinh viên xem trước import điểm thất bại vì dữ liệu preview không hợp lệ",
          metadata: {
            soDongNguon: command.rows.length,
            maHocKy: command.maHocKy ?? null,
            stage: "PREVIEW_IMPORT",
            errorMessage: error.message
          }
        });
        throw boSungHuongDanNhapThuCongDiemSo(error, "PREVIEW_IMPORT");
      }

      await this.deps.dichVuGhiLogLoiDiemSo.ghi({
        actorId: command.actorId,
        action: "GRADE_IMPORT_PREVIEW_FAILED",
        tableName: "thanh_phan_diem",
        message: "Lỗi tạo preview import điểm số",
        error,
        metadata: {
          soDongNguon: command.rows.length,
          maHocKy: command.maHocKy ?? null
        }
      });
      throw new LoiUngDung(
        500,
        CacLoi.INTERNAL_ERROR,
        "Hệ thống bận, không thể xem trước file điểm số lúc này",
        taoChiTietImportDiemThatBaiChoNhapThuCong("PREVIEW_IMPORT", {
          soDongNguon: command.rows.length,
          maHocKy: command.maHocKy ?? null
        })
      );
    }
  }

  private async taoPreview(command: LenhPreviewImportDiemSo) {
    if (!command.maHocKy) {
      throw LoiUngDung.yeuCauSai("Cần chọn học kỳ trước khi import điểm số");
    }

    const hocKy = await this.deps.khoDiemSo.timHocKyCuaSinhVien(command.maHocKy, command.actorId);

    if (!hocKy) {
      throw LoiUngDung.khongCoQuyen("Học kỳ import không thuộc sinh viên");
    }

    if (!hocKyDaKetThuc(hocKy)) {
      await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
        actorId: command.actorId,
        action: "GRADE_IMPORT_CURRENT_SEMESTER_REJECTED",
        tableName: "thanh_phan_diem",
        message: "Sinh viên import điểm thất bại vì học kỳ hiện tại hoặc chưa kết thúc chỉ cho phép nhập thủ công",
        metadata: {
          maHocKy: command.maHocKy,
          tenHocKy: hocKy.tenHocKy,
          ngayKetThuc: hocKy.ngayKetThuc,
          stage: "CURRENT_SEMESTER"
        }
      });
      throw LoiUngDung.khongTheXuLy(
        "Học kỳ hiện tại chưa đủ điểm, vui lòng nhập điểm thủ công",
        taoChiTietImportDiemThatBaiChoNhapThuCong("CURRENT_SEMESTER", { maHocKy: command.maHocKy })
      );
    }

    if (command.rows.length === 0) {
      throw LoiUngDung.yeuCauSai("Không có dòng dữ liệu điểm số để xem trước");
    }

    const loiMapping = this.deps.dichVuMappingImportDiemSo.kiemTraMapping(command.mapping);

    if (loiMapping.length > 0) {
      throw LoiUngDung.yeuCauSai("Cấu hình map cột import điểm số không hợp lệ", loiMapping);
    }

    const preview: DongPreviewImportDiemSo[] = [];

    for (const [index, row] of command.rows.entries()) {
      const rowIndex = index + 2;
      const chuanHoa = this.deps.dichVuMappingImportDiemSo.chuanHoaDong(row, command.mapping, rowIndex);
      const loi = [...chuanHoa.loi];

      if (chuanHoa.maMonHoc && !laUuid(chuanHoa.maMonHoc)) {
        loi.push("Mã môn học không đúng định dạng UUID");
      }

      let diemSo: DuLieuImportDiemSo | null = null;

      if (loi.length === 0) {
        diemSo = await this.taoDongDiemSo(command, command.maHocKy, chuanHoa, loi);
      }

      preview.push({
        rowIndex,
        hopLe: loi.length === 0,
        loi,
        diemSo
      });
    }

    const soDongHopLe = preview.filter((item) => item.hopLe).length;
    const soDongLoi = preview.length - soDongHopLe;
    const soDongThieuMonHoc = preview.filter((item) => item.loi.includes(THONG_BAO_IMPORT_DIEM_THIEU_MON_HOC)).length;
    const soDongLoiNhapDiemThuCong = preview.filter(
      (item) => !item.hopLe && !item.loi.includes(THONG_BAO_IMPORT_DIEM_THIEU_MON_HOC)
    ).length;

    if (soDongLoi > 0) {
      await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
        actorId: command.actorId,
        action: "GRADE_IMPORT_PREVIEW_HAS_INVALID_ROWS",
        tableName: "thanh_phan_diem",
        message: "Preview import điểm có dòng không hợp lệ, hệ thống hướng dẫn sinh viên nhập thủ công khi cần",
        metadata: {
          soDongNguon: command.rows.length,
          soDongHopLe,
          soDongLoi,
          soDongThieuMonHoc,
          soDongLoiNhapDiemThuCong,
          maHocKy: command.maHocKy,
          stage: "PREVIEW_HAS_INVALID_ROWS"
        }
      });
    }

    return {
      message:
        soDongThieuMonHoc > 0
          ? THONG_BAO_IMPORT_DIEM_THIEU_MON_HOC
          : soDongLoi > 0
            ? "Preview điểm số có dòng cần kiểm tra"
            : "Preview điểm số hợp lệ",
      totalRows: preview.length,
      validRows: soDongHopLe,
      invalidRows: soDongLoi,
      missingCourseRows: soDongThieuMonHoc,
      manualEntry:
        soDongLoiNhapDiemThuCong > 0
          ? taoThongTinNhapThuCongDiemSo("PREVIEW_HAS_INVALID_ROWS", { invalidRows: soDongLoiNhapDiemThuCong })
          : null,
      courseEntry:
        soDongThieuMonHoc > 0
          ? taoThongTinThemMonHocChoImportDiem("COURSE_MISSING", { missingCourseRows: soDongThieuMonHoc })
          : null,
      items: preview
    };
  }

  private async taoDongDiemSo(
    command: LenhPreviewImportDiemSo,
    maHocKy: string,
    chuanHoa: DongImportDiemDaChuanHoa,
    loi: string[]
  ): Promise<DuLieuImportDiemSo | null> {
    const monHocPhuHop = await this.deps.khoDiemSo.timMonHocChoImport({
      actorId: command.actorId,
      maHocKy,
      maMonHoc: chuanHoa.maMonHoc,
      maMon: chuanHoa.maMon,
      tenMon: chuanHoa.tenMon
    });

    if (monHocPhuHop.length > 1) {
      loi.push("Môn học khớp nhiều kết quả, vui lòng map bằng mã môn học chính xác");
      return null;
    }

    if (monHocPhuHop.length === 1) {
      const monHoc = monHocPhuHop[0];

      return {
        rowIndex: chuanHoa.rowIndex,
        maMonHoc: monHoc.maMonHoc,
        maMon: monHoc.maMon,
        tenMon: monHoc.tenMon,
        soTinChi: monHoc.soTinChi,
        tenThanhPhan: chuanHoa.tenThanhPhan ?? "",
        trongSo: chuanHoa.trongSo ?? 0,
        diem: chuanHoa.diem ?? 0,
        tuDongTaoMonHoc: false
      };
    }

    if (chuanHoa.maMonHoc) {
      loi.push(THONG_BAO_IMPORT_DIEM_THIEU_MON_HOC);
      return null;
    }

    const tenMonTuDong = chuanHoa.tenMon ?? chuanHoa.maMon;

    if (!tenMonTuDong) {
      loi.push(THONG_BAO_IMPORT_DIEM_THIEU_MON_HOC);
      return null;
    }

    loi.push(THONG_BAO_IMPORT_DIEM_THIEU_MON_HOC);
    return null;
  }
}
