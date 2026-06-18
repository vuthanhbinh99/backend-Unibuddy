import { v7 as uuidv7 } from "uuid";
import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type { KhoPhienDangNhap } from "../application/ports/session.repository.js";
import type { DuLieuTaoPhienDangNhap, PhienDangNhap } from "../domain/session.js";

type DongPhienDangNhap = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  fcmToken: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastActiveAt: Date;
  createdAt: Date;
};

const anhXaPhienDangNhap = (row: DongPhienDangNhap): PhienDangNhap => ({
  id: row.id,
  userId: row.userId,
  refreshTokenHash: row.refreshTokenHash,
  fcmToken: row.fcmToken,
  deviceType: row.deviceType,
  ipAddress: row.ipAddress,
  userAgent: row.userAgent,
  expiresAt: row.expiresAt,
  revokedAt: row.revokedAt,
  lastActiveAt: row.lastActiveAt,
  createdAt: row.createdAt
});

export class KhoPhienDangNhapPostgres implements KhoPhienDangNhap {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async tao(data: DuLieuTaoPhienDangNhap, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongPhienDangNhap>(
      `
        INSERT INTO phien_dang_nhap (
          ma_phien,
          ma_nguoi_dung,
          refresh_token,
          fcm_token,
          loai_thiet_bi,
          ip_address,
          user_agent,
          thoi_gian_het_han,
          lan_hoat_dong_cuoi,
          thoi_gian_tao
        )
        VALUES ($1, $2, $3, $4, $5, $6::inet, $7, $8, NOW(), NOW())
        RETURNING
          ma_phien AS "id",
          ma_nguoi_dung AS "userId",
          refresh_token AS "refreshTokenHash",
          fcm_token AS "fcmToken",
          loai_thiet_bi AS "deviceType",
          ip_address::text AS "ipAddress",
          user_agent AS "userAgent",
          thoi_gian_het_han AS "expiresAt",
          thoi_gian_thu_hoi AS "revokedAt",
          lan_hoat_dong_cuoi AS "lastActiveAt",
          thoi_gian_tao AS "createdAt"
      `,
      [
        uuidv7(),
        data.userId,
        data.refreshTokenHash,
        data.fcmToken ?? null,
        data.deviceType ?? null,
        data.ipAddress ?? null,
        data.userAgent ?? null,
        data.expiresAt
      ]
    );

    return anhXaPhienDangNhap(ketQua.rows[0]);
  }

  async timTheoBamTokenLamMoi(refreshTokenHash: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongPhienDangNhap>(
      `
        UPDATE phien_dang_nhap
        SET lan_hoat_dong_cuoi = NOW()
        WHERE refresh_token = $1
          AND thoi_gian_thu_hoi IS NULL
          AND thoi_gian_het_han > NOW()
        RETURNING
          ma_phien AS "id",
          ma_nguoi_dung AS "userId",
          refresh_token AS "refreshTokenHash",
          fcm_token AS "fcmToken",
          loai_thiet_bi AS "deviceType",
          ip_address::text AS "ipAddress",
          user_agent AS "userAgent",
          thoi_gian_het_han AS "expiresAt",
          thoi_gian_thu_hoi AS "revokedAt",
          lan_hoat_dong_cuoi AS "lastActiveAt",
          thoi_gian_tao AS "createdAt"
      `,
      [refreshTokenHash]
    );

    return ketQua.rows[0] ? anhXaPhienDangNhap(ketQua.rows[0]) : null;
  }

  async lamSachFcmToken(fcmToken: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    await boThucThi.truyVan(
      `
        UPDATE phien_dang_nhap
        SET fcm_token = NULL
        WHERE fcm_token = $1
          AND thoi_gian_thu_hoi IS NULL
      `,
      [fcmToken]
    );
  }

  async thuHoiTheoBamTokenLamMoi(refreshTokenHash: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    await boThucThi.truyVan(
      `
        UPDATE phien_dang_nhap
        SET thoi_gian_thu_hoi = COALESCE(thoi_gian_thu_hoi, NOW())
        WHERE refresh_token = $1
      `,
      [refreshTokenHash]
    );
  }

  async thuHoiPhienHoatDongTheoMaNguoiDung(userId: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    await boThucThi.truyVan(
      `
        UPDATE phien_dang_nhap
        SET thoi_gian_thu_hoi = COALESCE(thoi_gian_thu_hoi, NOW())
        WHERE ma_nguoi_dung = $1
          AND thoi_gian_thu_hoi IS NULL
      `,
      [userId]
    );
  }
}



