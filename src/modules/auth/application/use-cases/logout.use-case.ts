import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import type { KhoPhienDangNhap } from "../ports/session.repository.js";
import type { DichVuToken } from "../ports/token.service.js";

export type LenhDangXuat = {
  refreshToken: string;
  actorId?: string | null;
};

type PhuThuoc = {
  khoPhienDangNhap: KhoPhienDangNhap;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuToken: DichVuToken;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyDangXuat {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDangXuat): Promise<void> {
    const refreshTokenHash = this.deps.dichVuToken.bamTokenLamMoi(command.refreshToken);

    await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      await this.deps.khoPhienDangNhap.thuHoiTheoBamTokenLamMoi(refreshTokenHash, tx);
      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId ?? null,
          level: "INFO",
          action: "AUTH_LOGOUT",
          tableName: "phien_dang_nhap",
          message: "Người dùng đã đăng xuất"
        },
        tx
      );
    });
  }
}



