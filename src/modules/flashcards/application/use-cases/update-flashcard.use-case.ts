import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";
import { kiemTraNoiDungTheFlashcard, laUuidHopLe } from "../services/flashcard-validation.service.js";

export type LenhCapNhatTheFlashcard = {
  actorId: string;
  maFlashcard: string;
  matTruoc?: string | null;
  matSau?: string | null;
};

type PhuThuoc = {
  khoFlashcard: KhoFlashcard;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiFlashcard: DichVuGhiLogLoiFlashcard;
};

export class XuLyCapNhatTheFlashcard {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatTheFlashcard) {
    const { matTruoc, matSau, loi } = kiemTraNoiDungTheFlashcard(command);

    if (!laUuidHopLe(command.maFlashcard)) {
      loi.push("Mã thẻ flashcard không hợp lệ");
    }

    if (loi.length > 0) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_CARD_UPDATE_VALIDATION_FAILED",
        tableName: "flashcard",
        recordId: command.maFlashcard,
        message: "Cập nhật thẻ thất bại - Dữ liệu trống",
        metadata: { errors: loi }
      });
      throw LoiUngDung.yeuCauSai("Nội dung thẻ không được để trống!", loi);
    }

    const theHienTai = await this.deps.khoFlashcard.timTheCuaSinhVien(command.maFlashcard, command.actorId);

    if (!theHienTai) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_CARD_UPDATE_FORBIDDEN",
        tableName: "flashcard",
        recordId: command.maFlashcard,
        message: "Cập nhật thẻ thất bại - Từ chối phân quyền",
        metadata: { maFlashcard: command.maFlashcard }
      });
      throw LoiUngDung.khongCoQuyen("Bạn không có quyền chỉnh sửa thẻ học này!");
    }

    try {
      const flashcard = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const the = await this.deps.khoFlashcard.capNhatThe({ maFlashcard: command.maFlashcard, matTruoc, matSau }, tx);

        if (!the) {
          throw LoiUngDung.khongTimThay("Không tìm thấy thẻ flashcard cần cập nhật");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "FLASHCARD_CARD_UPDATED",
            tableName: "flashcard",
            recordId: the.maFlashcard,
            message: "Sinh viên cập nhật nội dung thẻ flashcard thành công",
            metadata: {
              maBo: theHienTai.maBo,
              maFlashcard: the.maFlashcard
            }
          },
          tx
        );

        return the;
      });

      return {
        message: "Cập nhật nội dung thẻ thành công!",
        flashcard
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiFlashcard.ghi({
        actorId: command.actorId,
        action: "FLASHCARD_CARD_UPDATE_FAILED",
        tableName: "flashcard",
        recordId: command.maFlashcard,
        message: "Lỗi cập nhật thẻ flashcard",
        error,
        metadata: { maFlashcard: command.maFlashcard }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể cập nhật thẻ flashcard lúc này");
    }
  }
}
