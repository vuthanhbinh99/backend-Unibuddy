import type {
  BoLocNhatKyHeThong,
  KetQuaDanhSachNhatKyHeThong
} from "../../../audit-logs/domain/audit-log-entry.js";
import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";

export type LenhXemNhatKyHeThong = BoLocNhatKyHeThong & {
  requesterId: string;
};

type PhuThuoc = {
  khoNhatKyHeThong: KhoNhatKyHeThong;
};

export class XuLyXemNhatKyHeThong {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXemNhatKyHeThong): Promise<KetQuaDanhSachNhatKyHeThong> {
    const ketQua = await this.deps.khoNhatKyHeThong.lietKe(command);

    await this.deps.khoNhatKyHeThong.tao({
      actorId: command.requesterId,
      level: "INFO",
      action: "SYSTEM_AUDIT_LOGS_VIEWED",
      tableName: "nhat_ky_he_thong",
      message: "Quản trị viên xem nhật ký hệ thống",
      metadata: {
        page: command.page,
        limit: command.limit,
        levels: command.levels,
        action: command.action,
        filterActorId: command.actorId,
        from: command.from?.toISOString(),
        to: command.to?.toISOString()
      }
    });

    return ketQua;
  }
}
