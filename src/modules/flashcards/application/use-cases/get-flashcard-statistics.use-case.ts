import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";

export type LenhThongKeFlashcard = {
  actorId: string;
};

type PhuThuoc = {
  khoFlashcard: KhoFlashcard;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuGhiLogLoiFlashcard: DichVuGhiLogLoiFlashcard;
};

export class XuLyThongKeFlashcard {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhThongKeFlashcard) {
    try {
      const thongKe = await this.deps.khoFlashcard.layThongKe(command.actorId);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "INFO",
        action: "FLASHCARD_STATISTICS_VIEWED",
        tableName: "flashcard",
        message: thongKe.tongSoThe
          ? "Sinh viên xem thống kê tiến độ ghi nhớ"
          : "Xem thống kê tiến độ - Trạng thái: Trống",
        metadata: thongKe
      });

      return {
        message: thongKe.tongSoThe
          ? "Lấy thống kê tiến độ ôn tập thành công"
          : "Bạn chưa bắt đầu ôn tập để tính toán tiến độ",
        thongKe
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiFlashcard.ghi({
        actorId: command.actorId,
        action: "FLASHCARD_STATISTICS_FAILED",
        tableName: "flashcard",
        message: "Lỗi truy xuất thống kê tiến độ flashcard",
        error
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể tải thống kê flashcard lúc này");
    }
  }
}
