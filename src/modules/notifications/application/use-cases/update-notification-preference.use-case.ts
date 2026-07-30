import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoTuyChinhThongBaoDay } from "../ports/notification-preference.repository.js";

export type LenhCapNhatTuyChinhThongBaoDay = {
  actorId: string;
  nhanThongBao: boolean;
};

type PhuThuoc = {
  khoTuyChinhThongBaoDay: KhoTuyChinhThongBaoDay;
  khoNhatKyHeThong: KhoNhatKyHeThong;
};

export class XuLyCapNhatTuyChinhThongBaoDay {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatTuyChinhThongBaoDay) {
    try {
      await this.deps.khoTuyChinhThongBaoDay.capNhat(command.actorId, command.nhanThongBao);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "INFO",
        action: "NOTIFICATION_PREFERENCE_UPDATED",
        tableName: "nguoi_dung",
        recordId: command.actorId,
        message: "Người dùng cập nhật tùy chọn nhận thông báo",
        metadata: {
          nhanThongBao: command.nhanThongBao
        }
      });

      return {
        message: "Cập nhật tùy chọn nhận thông báo thành công",
        nhanThongBao: command.nhanThongBao
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.khoNhatKyHeThong
        .tao({
          actorId: command.actorId,
          level: "ERROR",
          action: "NOTIFICATION_PREFERENCE_UPDATE_FAILED",
          tableName: "nguoi_dung",
          recordId: command.actorId,
          message: "Lỗi khi cập nhật tùy chọn nhận thông báo",
          metadata: {
            nhanThongBao: command.nhanThongBao,
            errorName: error instanceof Error ? error.name : "UnknownError"
          }
        })
        .catch(() => undefined);

      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Không thể lưu tùy chọn, vui lòng thử lại sau!");
    }
  }
}
