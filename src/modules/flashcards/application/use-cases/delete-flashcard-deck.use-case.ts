import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";
import { laUuidHopLe } from "../services/flashcard-validation.service.js";

export type LenhXoaBoFlashcard = {
  actorId: string;
  maBo: string;
};

type PhuThuoc = {
  khoFlashcard: KhoFlashcard;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiFlashcard: DichVuGhiLogLoiFlashcard;
};

export class XuLyXoaBoFlashcard {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXoaBoFlashcard) {
    if (!laUuidHopLe(command.maBo)) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_DECK_DELETE_VALIDATION_FAILED",
        tableName: "bo_flashcard",
        recordId: command.maBo,
        message: "Thao tác xóa bộ flashcard thất bại do mã bộ không hợp lệ"
      });
      throw LoiUngDung.yeuCauSai("Mã bộ flashcard không hợp lệ");
    }

    const boHienTai = await this.deps.khoFlashcard.timBoCuaSinhVien(command.maBo, command.actorId);

    if (!boHienTai) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_DECK_DELETE_FORBIDDEN",
        tableName: "bo_flashcard",
        recordId: command.maBo,
        message: "Thao tác xóa bộ flashcard thất bại do vi phạm phân quyền",
        metadata: { maBo: command.maBo }
      });
      throw LoiUngDung.khongCoQuyen("Bạn không thể xóa bộ flashcard của người khác!");
    }

    try {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const daXoa = await this.deps.khoFlashcard.xoaBo(command.maBo, command.actorId, tx);

        if (!daXoa) {
          throw LoiUngDung.khongTimThay("Không tìm thấy bộ flashcard cần xóa");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "FLASHCARD_DECK_DELETED",
            tableName: "bo_flashcard",
            recordId: command.maBo,
            message: "Xóa bộ flashcard thành công",
            metadata: {
              maBo: command.maBo,
              tenBo: boHienTai.tenBo,
              soThe: boHienTai.soThe
            }
          },
          tx
        );
      });

      return {
        message: "Xóa bộ flashcard thành công"
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiFlashcard.ghi({
        actorId: command.actorId,
        action: "FLASHCARD_DECK_DELETE_FAILED",
        tableName: "bo_flashcard",
        recordId: command.maBo,
        message: "Lỗi xóa bộ flashcard",
        error,
        metadata: { maBo: command.maBo }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể xóa bộ flashcard lúc này");
    }
  }
}
