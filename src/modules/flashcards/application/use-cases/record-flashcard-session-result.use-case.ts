import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoThongBaoHeThong } from "../../../notifications/application/ports/system-notification.repository.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";
import { laUuidHopLe } from "../services/flashcard-validation.service.js";

export type LenhGhiKetQuaPhienFlashcard = {
  actorId: string;
  maBo: string;
  soCauDung: number;
  soCauSai: number;
};

type PhuThuoc = {
  khoFlashcard: KhoFlashcard;
  khoThongBaoHeThong: KhoThongBaoHeThong;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuGhiLogLoiFlashcard: DichVuGhiLogLoiFlashcard;
};

export class XuLyGhiKetQuaPhienFlashcard {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhGhiKetQuaPhienFlashcard) {
    if (!laUuidHopLe(command.maBo)) {
      throw LoiUngDung.yeuCauSai("Mã bộ flashcard không hợp lệ");
    }

    const bo = await this.deps.khoFlashcard.timBoCuaSinhVien(command.maBo, command.actorId);

    if (!bo) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_SESSION_RESULT_FORBIDDEN",
        tableName: "bo_flashcard",
        recordId: command.maBo,
        message: "Ghi kết quả phiên ôn tập thất bại - Từ chối phân quyền",
        metadata: { maBo: command.maBo }
      });
      throw LoiUngDung.khongCoQuyen("Bạn không có quyền ghi kết quả bộ thẻ này!");
    }

    const soCauSai = Math.max(0, Math.trunc(command.soCauSai));
    const soCauDung = Math.max(0, Math.trunc(command.soCauDung));

    if (soCauSai > 0) {
      await this.deps.khoThongBaoHeThong.taoNhieu({
        actorId: command.actorId,
        title: "Kết quả ôn tập flashcard",
        content:
          `Bạn làm sai ${soCauSai} câu trong bộ '${bo.tenBo}'. ` +
          "Hệ thống đã đưa các thẻ này quay lại để bạn ôn tập lại.",
        recipients: [
          {
            userId: command.actorId,
            email: "",
            fullName: "",
            roleCode: "SINH_VIEN"
          }
        ]
      });
    }

    await this.deps.khoNhatKyHeThong.tao({
      actorId: command.actorId,
      level: "INFO",
      action: "FLASHCARD_SESSION_COMPLETED",
      tableName: "flashcard",
      recordId: command.maBo,
      message: "Sinh viên hoàn thành phiên ôn tập bộ thẻ",
      metadata: {
        maBo: command.maBo,
        tenBo: bo.tenBo,
        soCauDung,
        soCauSai
      }
    });

    return {
      message: soCauSai > 0 ? "Đã ghi nhận kết quả phiên và tạo thông báo nhắc ôn lại" : "Đã ghi nhận kết quả phiên ôn tập",
      soCauDung,
      soCauSai
    };
  }
}
