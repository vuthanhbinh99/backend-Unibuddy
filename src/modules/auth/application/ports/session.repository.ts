import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type { DuLieuTaoPhienDangNhap, PhienDangNhap } from "../../domain/session.js";

export interface KhoPhienDangNhap {
  tao(data: DuLieuTaoPhienDangNhap, boThucThi?: BoThucThiTruyVan): Promise<PhienDangNhap>;
  timTheoBamTokenLamMoi(
    refreshTokenHash: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<PhienDangNhap | null>;
  lamSachFcmToken(fcmToken: string, boThucThi?: BoThucThiTruyVan): Promise<void>;
  thuHoiTheoBamTokenLamMoi(refreshTokenHash: string, boThucThi?: BoThucThiTruyVan): Promise<void>;
  thuHoiPhienHoatDongTheoMaNguoiDung(userId: string, boThucThi?: BoThucThiTruyVan): Promise<void>;
}



