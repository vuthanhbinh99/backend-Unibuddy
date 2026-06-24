import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { BoDocTepImportDiemSo, TepImportDiemSo } from "../ports/grade-import-parser.js";
import type { DichVuGhiLogLoiDiemSo } from "../services/grade-error-logger.service.js";
import {
  boSungHuongDanNhapThuCongDiemSo,
  taoChiTietImportDiemThatBaiChoNhapThuCong
} from "../services/grade-import-manual-fallback.service.js";

export type LenhTrichXuatHeaderImportDiemSo = TepImportDiemSo & {
  actorId: string;
};

type PhuThuoc = {
  boDocTepImportDiemSo: BoDocTepImportDiemSo;
  dichVuGhiLogLoiDiemSo: DichVuGhiLogLoiDiemSo;
};

const COT_TEMPLATE_DIEM_SO = ["Mã môn", "Tên môn", "Số tín chỉ", "Tên thành phần", "Trọng số", "Điểm"];
const COT_TEMPLATE_DIEM_TONG_KET = ["Mã môn", "Tên môn", "Số tín chỉ", "Điểm tổng kết"];

export class XuLyTrichXuatHeaderImportDiemSo {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTrichXuatHeaderImportDiemSo) {
    try {
      const ketQua = await this.deps.boDocTepImportDiemSo.doc({
        buffer: command.buffer,
        tenFile: command.tenFile,
        mimeType: command.mimeType
      });

      return {
        message: "Trích xuất header file điểm số thành công",
        templateColumns: {
          thanhPhanDiem: COT_TEMPLATE_DIEM_SO,
          diemTongKet: COT_TEMPLATE_DIEM_TONG_KET
        },
        parserScope:
          "Hệ thống hỗ trợ parser chuẩn cho bảng điểm STU và file Excel template. Trường khác vui lòng dùng template để map cột chính xác.",
        ...ketQua
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
          actorId: command.actorId,
          action: "GRADE_IMPORT_HEADER_REJECTED",
          tableName: "thanh_phan_diem",
          message: "Sinh viên trích xuất header import điểm thất bại vì file không hợp lệ",
          metadata: {
            tenFile: command.tenFile,
            mimeType: command.mimeType,
            stage: "EXTRACT_HEADERS",
            errorMessage: error.message
          }
        });
        throw boSungHuongDanNhapThuCongDiemSo(error, "EXTRACT_HEADERS");
      }

      await this.deps.dichVuGhiLogLoiDiemSo.ghi({
        actorId: command.actorId,
        action: "GRADE_IMPORT_HEADER_FAILED",
        tableName: "thanh_phan_diem",
        message: "Lỗi trích xuất header file điểm số",
        error,
        metadata: {
          tenFile: command.tenFile,
          mimeType: command.mimeType
        }
      });
      throw new LoiUngDung(
        500,
        CacLoi.INTERNAL_ERROR,
        "Hệ thống bận, không thể đọc file điểm số lúc này",
        taoChiTietImportDiemThatBaiChoNhapThuCong("EXTRACT_HEADERS", {
          tenFile: command.tenFile,
          mimeType: command.mimeType
        })
      );
    }
  }
}
