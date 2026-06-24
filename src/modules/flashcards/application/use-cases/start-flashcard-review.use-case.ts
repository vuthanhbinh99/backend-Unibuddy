import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";
import { laUuidHopLe } from "../services/flashcard-validation.service.js";

export type LenhBatDauOnTapFlashcard = {
  actorId: string;
  maBo: string;
};

type PhuThuoc = {
  khoFlashcard: KhoFlashcard;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuGhiLogLoiFlashcard: DichVuGhiLogLoiFlashcard;
};

export class XuLyBatDauOnTapFlashcard {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhBatDauOnTapFlashcard) {
    if (!laUuidHopLe(command.maBo)) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_REVIEW_DECK_ID_INVALID",
        tableName: "bo_flashcard",
        recordId: command.maBo,
        message: "Truy cập bộ thẻ ôn tập thất bại - Mã bộ không hợp lệ"
      });
      throw LoiUngDung.yeuCauSai("Mã bộ flashcard không hợp lệ");
    }

    const bo = await this.deps.khoFlashcard.timBoCuaSinhVien(command.maBo, command.actorId);

    if (!bo) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_REVIEW_FORBIDDEN",
        tableName: "bo_flashcard",
        recordId: command.maBo,
        message: "Truy cập bộ thẻ ôn tập thất bại - Từ chối phân quyền",
        metadata: { maBo: command.maBo }
      });
      throw LoiUngDung.khongCoQuyen("Bạn không có quyền ôn tập bộ thẻ này!");
    }

    try {
      const items = await this.deps.khoFlashcard.lietKeTheCanOn(command.maBo, command.actorId);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "INFO",
        action: "FLASHCARD_REVIEW_STARTED",
        tableName: "flashcard",
        recordId: command.maBo,
        message: "Sinh viên bắt đầu phiên ôn tập bộ thẻ thành công",
        metadata: {
          maBo: command.maBo,
          tenBo: bo.tenBo,
          dueCount: items.length
        }
      });

      return {
        message: items.length ? "Tải danh sách thẻ cần ôn tập thành công" : "Chưa có thẻ nào cần ôn tập lúc này",
        items
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiFlashcard.ghi({
        actorId: command.actorId,
        action: "FLASHCARD_REVIEW_LOAD_FAILED",
        tableName: "flashcard",
        recordId: command.maBo,
        message: "Lỗi tải danh sách thẻ cần ôn tập",
        error,
        metadata: { maBo: command.maBo }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể tải phiên ôn tập lúc này");
    }
  }
}
