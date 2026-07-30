import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";

/**
 * Tùy chỉnh nhắc nhở deadline của một sinh viên.
 * - `null`: dùng mốc mặc định (24h và 3h trước hạn).
 * - `0`: tắt nhắc nhở.
 * - `24` | `12` | `3`: nhắc một lần trước hạn số giờ tương ứng.
 */
export interface KhoTuyChinhNhacNho {
  layTheoNguoiDung(maNguoiDung: string, boThucThi?: BoThucThiTruyVan): Promise<number | null>;
  capNhat(maNguoiDung: string, soGioTruocHan: number | null, boThucThi?: BoThucThiTruyVan): Promise<void>;
}
