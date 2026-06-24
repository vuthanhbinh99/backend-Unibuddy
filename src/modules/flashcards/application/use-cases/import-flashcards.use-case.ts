import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { BoDocTepImportFlashcard, TepImportFlashcard } from "../ports/flashcard-import-parser.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";
import { kiemTraNoiDungTheFlashcard, laUuidHopLe } from "../services/flashcard-validation.service.js";

const DUNG_LUONG_FILE_IMPORT_TOI_DA = 5 * 1024 * 1024;

export type LenhImportFlashcards = {
  actorId: string;
  maBo: string;
  file?: TepImportFlashcard | null;
};

type PhuThuoc = {
  khoFlashcard: KhoFlashcard;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  boDocTepImportFlashcard: BoDocTepImportFlashcard;
  dichVuGhiLogLoiFlashcard: DichVuGhiLogLoiFlashcard;
};

export class XuLyImportFlashcards {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhImportFlashcards) {
    if (!laUuidHopLe(command.maBo)) {
      await this.ghiCanhBao(command, "FLASHCARD_IMPORT_DECK_ID_INVALID", "Nhập thẻ từ file thất bại - Mã bộ không hợp lệ");
      throw LoiUngDung.yeuCauSai("Mã bộ flashcard không hợp lệ");
    }

    if (!command.file) {
      await this.ghiCanhBao(command, "FLASHCARD_IMPORT_FILE_MISSING", "Nhập thẻ từ file thất bại - Chưa tải file");
      throw LoiUngDung.yeuCauSai("Vui lòng tải file mẫu chứa danh sách thẻ");
    }

    if (command.file.buffer.byteLength > DUNG_LUONG_FILE_IMPORT_TOI_DA) {
      await this.ghiCanhBao(command, "FLASHCARD_IMPORT_FILE_TOO_LARGE", "Nhập thẻ từ file thất bại - File vượt quá 5MB");
      throw LoiUngDung.yeuCauSai("File vượt quá dung lượng tối đa 5MB");
    }

    let ketQuaDoc;

    try {
      ketQuaDoc = this.deps.boDocTepImportFlashcard.doc(command.file);
    } catch (error) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_IMPORT_FILE_INVALID",
        tableName: "flashcard",
        recordId: command.maBo,
        message: "Nhập thẻ từ file thất bại - Lỗi định dạng tệp",
        metadata: {
          tenFile: command.file.tenFile,
          mimeType: command.file.mimeType,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      });

      if (error instanceof LoiUngDung) {
        throw error;
      }

      throw LoiUngDung.yeuCauSai("Cấu trúc hoặc dữ liệu bên trong file không đúng mẫu!");
    }

    const rowErrors: Array<{ rowIndex: number; errors: string[] }> = [];
    const duLieuHopLe = ketQuaDoc.rows.map((row) => {
      const { matTruoc, matSau, loi } = kiemTraNoiDungTheFlashcard(row);

      if (loi.length > 0) {
        rowErrors.push({ rowIndex: row.rowIndex, errors: loi });
      }

      return { maBo: command.maBo, matTruoc, matSau };
    });

    if (duLieuHopLe.length === 0 || rowErrors.length > 0) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_IMPORT_ROWS_INVALID",
        tableName: "flashcard",
        recordId: command.maBo,
        message: "Nhập thẻ từ file thất bại - Dữ liệu từng dòng không hợp lệ",
        metadata: {
          totalRows: ketQuaDoc.rows.length,
          rowErrors
        }
      });
      throw LoiUngDung.yeuCauSai("Cấu trúc hoặc dữ liệu bên trong file không đúng mẫu!", {
        rowErrors,
        requiredHeaders: ["CAU_HOI", "DAP_AN"]
      });
    }

    const bo = await this.deps.khoFlashcard.timBoCuaSinhVien(command.maBo, command.actorId);

    if (!bo) {
      await this.ghiCanhBao(command, "FLASHCARD_IMPORT_FORBIDDEN", "Nhập thẻ từ file thất bại - Từ chối phân quyền");
      throw LoiUngDung.khongCoQuyen("Bạn không có quyền nhập thẻ vào bộ này!");
    }

    try {
      const items = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const flashcards = await this.deps.khoFlashcard.taoNhieuThe(duLieuHopLe, tx);

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "FLASHCARD_IMPORTED",
            tableName: "flashcard",
            recordId: command.maBo,
            message: "Sinh viên nhập hàng loạt thẻ con từ file thành công",
            metadata: {
              maBo: command.maBo,
              tenBo: bo.tenBo,
              sourceType: ketQuaDoc.sourceType,
              headers: ketQuaDoc.headers,
              importedCount: flashcards.length
            }
          },
          tx
        );

        return flashcards;
      });

      return {
        message: `Nhập thành công ${items.length} thẻ Flashcard!`,
        importedCount: items.length,
        items
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiFlashcard.ghi({
        actorId: command.actorId,
        action: "FLASHCARD_IMPORT_FAILED",
        tableName: "flashcard",
        recordId: command.maBo,
        message: "Lỗi lưu danh sách thẻ flashcard import vào Cơ sở dữ liệu",
        error,
        metadata: {
          maBo: command.maBo,
          totalRows: duLieuHopLe.length
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể nhập thẻ flashcard lúc này");
    }
  }

  private async ghiCanhBao(command: LenhImportFlashcards, action: string, message: string) {
    await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
      actorId: command.actorId,
      action,
      tableName: "flashcard",
      recordId: command.maBo,
      message,
      metadata: {
        maBo: command.maBo,
        tenFile: command.file?.tenFile ?? null
      }
    });
  }
}
