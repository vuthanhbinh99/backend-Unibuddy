import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";

/**
 * Tùy chọn nhận thông báo đẩy (FCM) của một người dùng.
 * - `true`: nhận thông báo đẩy (mặc định).
 * - `false`: đã tắt, backend không gửi FCM tới thiết bị của người dùng.
 */
export interface KhoTuyChinhThongBaoDay {
  layTheoNguoiDung(maNguoiDung: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
  capNhat(maNguoiDung: string, nhanThongBao: boolean, boThucThi?: BoThucThiTruyVan): Promise<void>;
}
