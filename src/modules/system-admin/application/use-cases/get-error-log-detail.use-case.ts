import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { NhatKyHeThong } from "../../../audit-logs/domain/audit-log-entry.js";

type LenhXemChiTietLoiHeThong = {
  actorId: string;
  logId: string;
};

type PhuThuoc = {
  khoNhatKyHeThong: KhoNhatKyHeThong;
};

export class XuLyXemChiTietLoiHeThong {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXemChiTietLoiHeThong): Promise<NhatKyHeThong> {
    const log = await this.deps.khoNhatKyHeThong.timTheoMa(command.logId);

    if (!log || !["ERROR", "CRITICAL"].includes(log.level)) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "WARNING",
        action: "SYSTEM_ERROR_LOG_DETAIL_NOT_FOUND",
        tableName: "nhat_ky_he_thong",
        recordId: command.logId,
        message: "Quản trị viên yêu cầu chi tiết không tồn tại",
        metadata: {
          logId: command.logId
        }
      });

      throw LoiUngDung.khongTimThay("Không tìm thấy log lỗi hệ thống");
    }

    await this.deps.khoNhatKyHeThong.tao({
      actorId: command.actorId,
      level: "INFO",
      action: "SYSTEM_ERROR_LOG_DETAIL_VIEWED",
      tableName: "nhat_ky_he_thong",
      recordId: command.logId,
      message: "Quản trị viên xem chi tiết lỗi hệ thống",
      metadata: {
        logId: command.logId,
        errorLevel: log.level,
        errorAction: log.action
      }
    });

    return log;
  }
}
