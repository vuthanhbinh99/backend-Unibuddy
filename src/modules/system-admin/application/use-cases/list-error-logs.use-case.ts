import type {
  BoLocNhatKyHeThong,
  KetQuaDanhSachNhatKyHeThong
} from "../../../audit-logs/domain/audit-log-entry.js";
import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";

export type LenhXemLoiHeThong = Omit<BoLocNhatKyHeThong, "levels"> & {
  requesterId: string;
};

type PhuThuoc = {
  khoNhatKyHeThong: KhoNhatKyHeThong;
};

export class XuLyXemLoiHeThong {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXemLoiHeThong): Promise<KetQuaDanhSachNhatKyHeThong> {
    const ketQua = await this.deps.khoNhatKyHeThong.lietKe({
      ...command,
      levels: ["ERROR", "CRITICAL"]
    });

    await this.deps.khoNhatKyHeThong.tao({
      actorId: command.requesterId,
      level: "INFO",
      action: "SYSTEM_ERROR_LOGS_VIEWED",
      tableName: "nhat_ky_he_thong",
      message: "Quản trị viên xem danh sách lỗi hệ thống",
      metadata: {
        page: command.page,
        limit: command.limit,
        action: command.action,
        from: command.from?.toISOString(),
        to: command.to?.toISOString()
      }
    });

    return ketQua;
  }
}
