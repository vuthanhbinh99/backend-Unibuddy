import type { PhienDangNhapCongKhai } from "../../domain/session.js";
import type { KhoPhienDangNhap } from "../ports/session.repository.js";
import type { DichVuToken } from "../ports/token.service.js";

export type LenhLietKePhienDangNhapCuaToi = {
  userId: string;
  refreshToken: string;
};

type PhuThuoc = {
  khoPhienDangNhap: KhoPhienDangNhap;
  dichVuToken: DichVuToken;
};

export class XuLyLietKePhienDangNhapCuaToi {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhLietKePhienDangNhapCuaToi): Promise<PhienDangNhapCongKhai[]> {
    const currentRefreshTokenHash = this.deps.dichVuToken.bamTokenLamMoi(command.refreshToken);

    return this.deps.khoPhienDangNhap.lietKeTheoMaNguoiDung(
      command.userId,
      currentRefreshTokenHash
    );
  }
}