import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";
import { kiemTraNoiDungTheFlashcard, laUuidHopLe } from "../services/flashcard-validation.service.js";

export type LenhTaoTheFlashcard = {
  actorId: string;
  maBo: string;
  matTruoc?: string | null;
  matSau?: string | null;
};

type PhuThuoc = {
  khoFlashcard: KhoFlashcard;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiFlashcard: DichVuGhiLogLoiFlashcard;
};

export class XuLyTaoTheFlashcard {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoTheFlashcard) {
    const { matTruoc, matSau, loi } = kiemTraNoiDungTheFlashcard(command);

    if (!laUuidHopLe(command.maBo)) {
      loi.push("Mã bộ flashcard không hợp lệ");
    }

    if (loi.length > 0) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_CARD_CREATE_VALIDATION_FAILED",
        tableName: "flashcard",
        recordId: command.maBo,
        message: "Thêm thẻ thủ công thất bại - Dữ liệu trống",
        metadata: { errors: loi }
      });
      throw LoiUngDung.yeuCauSai("Nội dung thẻ không được để trống!", loi);
    }

    const bo = await this.deps.khoFlashcard.timBoCuaSinhVien(command.maBo, command.actorId);

    if (!bo) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_CARD_CREATE_FORBIDDEN",
        tableName: "flashcard",
        recordId: command.maBo,
        message: "Thêm thẻ thủ công thất bại - Từ chối phân quyền",
        metadata: { maBo: command.maBo }
      });
      throw LoiUngDung.khongCoQuyen("Bạn không có quyền thêm thẻ vào bộ này!");
    }

    try {
      const flashcard = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const the = await this.deps.khoFlashcard.taoThe({ maBo: command.maBo, matTruoc, matSau }, tx);

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "FLASHCARD_CARD_CREATED",
            tableName: "flashcard",
            recordId: the.maFlashcard,
            message: "Sinh viên thêm thẻ flashcard thủ công thành công",
            metadata: {
              maBo: command.maBo,
              maFlashcard: the.maFlashcard,
              tenBo: bo.tenBo
            }
          },
          tx
        );

        return the;
      });

      return {
        message: "Thêm thẻ flashcard thành công",
        flashcard
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiFlashcard.ghi({
        actorId: command.actorId,
        action: "FLASHCARD_CARD_CREATE_FAILED",
        tableName: "flashcard",
        recordId: command.maBo,
        message: "Lỗi lưu thẻ flashcard vào database",
        error,
        metadata: { maBo: command.maBo }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể thêm thẻ flashcard lúc này");
    }
  }
}
