import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoTuyChinhNhacNho } from "../ports/reminder-preference.repository.js";
import type { DichVuGhiLogLoiDeadline } from "../services/deadline-error-logger.service.js";
import { CAC_MOC_NHAC_CHO_PHEP_GIO } from "../services/deadline-reminder.service.js";

export type LenhCapNhatTuyChinhNhacNho = {
  actorId: string;
  soGioTruocHan?: number | null;
};

type PhuThuoc = {
  khoTuyChinhNhacNho: KhoTuyChinhNhacNho;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuGhiLogLoiDeadline: DichVuGhiLogLoiDeadline;
};

const laMocHopLe = (soGio: number | null): soGio is number | null =>
  soGio === null || CAC_MOC_NHAC_CHO_PHEP_GIO.includes(soGio as (typeof CAC_MOC_NHAC_CHO_PHEP_GIO)[number]);

export class XuLyCapNhatTuyChinhNhacNho {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatTuyChinhNhacNho) {
    const soGioTruocHan = command.soGioTruocHan ?? null;

    if (!laMocHopLe(soGioTruocHan)) {
      await this.deps.dichVuGhiLogLoiDeadline.ghiCanhBao({
        actorId: command.actorId,
        action: "DEADLINE_REMINDER_PREFERENCE_VALIDATION_FAILED",
        tableName: "nguoi_dung",
        message: "Sinh viên cập nhật tùy chỉnh nhắc nhở deadline với giá trị không hợp lệ",
        metadata: {
          soGioTruocHan
        }
      });
      throw LoiUngDung.yeuCauSai("Mốc nhắc nhở deadline không hợp lệ");
    }

    try {
      await this.deps.khoTuyChinhNhacNho.capNhat(command.actorId, soGioTruocHan);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "INFO",
        action: "DEADLINE_REMINDER_PREFERENCE_UPDATED",
        tableName: "nguoi_dung",
        recordId: command.actorId,
        message: "Sinh viên cập nhật tùy chỉnh nhắc nhở deadline",
        metadata: {
          soGioTruocHan
        }
      });

      return {
        message: "Cập nhật tùy chỉnh nhắc nhở deadline thành công",
        soGioTruocHan
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiDeadline.ghi({
        actorId: command.actorId,
        action: "DEADLINE_REMINDER_PREFERENCE_UPDATE_FAILED",
        tableName: "nguoi_dung",
        recordId: command.actorId,
        message: "Lỗi khi lưu tùy chỉnh nhắc nhở deadline",
        error,
        metadata: {
          soGioTruocHan
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Không thể lưu tùy chỉnh, vui lòng thử lại sau!");
    }
  }
}
