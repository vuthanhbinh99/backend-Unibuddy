import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";
import { laUuidHopLe } from "../services/flashcard-validation.service.js";

export type LenhXoaTheFlashcard = {
  actorId: string;
  maFlashcard: string;
};

type PhuThuoc = {
  khoFlashcard: KhoFlashcard;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiFlashcard: DichVuGhiLogLoiFlashcard;
};

export class XuLyXoaTheFlashcard {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXoaTheFlashcard) {
    if (!laUuidHopLe(command.maFlashcard)) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_CARD_DELETE_VALIDATION_FAILED",
        tableName: "flashcard",
        recordId: command.maFlashcard,
        message: "Xóa thẻ con thất bại - Mã thẻ không hợp lệ"
      });
      throw LoiUngDung.yeuCauSai("Mã thẻ flashcard không hợp lệ");
    }

    const theHienTai = await this.deps.khoFlashcard.timTheCuaSinhVien(command.maFlashcard, command.actorId);

    if (!theHienTai) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_CARD_DELETE_FORBIDDEN",
        tableName: "flashcard",
        recordId: command.maFlashcard,
        message: "Xóa thẻ con thất bại - Từ chối phân quyền",
        metadata: { maFlashcard: command.maFlashcard }
      });
      throw LoiUngDung.khongCoQuyen("Bạn không thể xóa thẻ flashcard của người khác!");
    }

    try {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const daXoa = await this.deps.khoFlashcard.xoaThe(command.maFlashcard, tx);

        if (!daXoa) {
          throw LoiUngDung.khongTimThay("Không tìm thấy thẻ flashcard cần xóa");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "FLASHCARD_CARD_DELETED",
            tableName: "flashcard",
            recordId: command.maFlashcard,
            message: "Sinh viên xóa thẻ flashcard con thành công",
            metadata: {
              maBo: theHienTai.maBo,
              maFlashcard: command.maFlashcard
            }
          },
          tx
        );
      });

      return {
        message: "Xóa thẻ thành công!"
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiFlashcard.ghi({
        actorId: command.actorId,
        action: "FLASHCARD_CARD_DELETE_FAILED",
        tableName: "flashcard",
        recordId: command.maFlashcard,
        message: "Lỗi xóa thẻ flashcard con",
        error,
        metadata: { maFlashcard: command.maFlashcard }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể xóa thẻ flashcard lúc này");
    }
  }
}
