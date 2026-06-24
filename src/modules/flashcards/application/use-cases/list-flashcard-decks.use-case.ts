import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";
import { laUuidHopLe } from "../services/flashcard-validation.service.js";

export type LenhDanhSachBoFlashcard = {
  actorId: string;
  maMonHoc?: string | null;
};

type PhuThuoc = {
  khoFlashcard: KhoFlashcard;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuGhiLogLoiFlashcard: DichVuGhiLogLoiFlashcard;
};

export class XuLyDanhSachBoFlashcard {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDanhSachBoFlashcard) {
    const maMonHoc = command.maMonHoc?.trim() || null;

    if (maMonHoc && !laUuidHopLe(maMonHoc)) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_DECK_LIST_VALIDATION_FAILED",
        tableName: "bo_flashcard",
        message: "Sinh viên xem danh sách bộ flashcard thất bại do mã môn học không hợp lệ",
        metadata: { maMonHoc }
      });
      throw LoiUngDung.yeuCauSai("Mã môn học không hợp lệ");
    }

    try {
      const items = await this.deps.khoFlashcard.lietKeBoCuaSinhVien({
        actorId: command.actorId,
        maMonHoc
      });

      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "INFO",
        action: "FLASHCARD_DECK_LIST_VIEWED",
        tableName: "bo_flashcard",
        message: items.length
          ? "Sinh viên xem danh sách bộ flashcard"
          : "Sinh viên xem danh sách bộ flashcard - Trạng thái: Trống",
        metadata: {
          maMonHoc,
          total: items.length
        }
      });

      return {
        message: items.length ? "Lấy danh sách bộ Flashcard thành công" : "Bạn chưa có bộ Flashcard nào",
        items
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiFlashcard.ghi({
        actorId: command.actorId,
        action: "FLASHCARD_DECK_LIST_FAILED",
        tableName: "bo_flashcard",
        message: "Lỗi truy xuất danh sách bộ flashcard",
        error,
        metadata: { maMonHoc }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể tải danh sách bộ flashcard lúc này");
    }
  }
}
