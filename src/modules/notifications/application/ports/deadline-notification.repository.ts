import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type { FcmTokenNguoiNhan } from "../../domain/system-notification.js";

export type DuLieuThongBaoNhacDeadline = {
  maNguoiNhan: string;
  maDeadline?: string | null;
  tieuDe: string;
  noiDung: string;
  loaiThongBao?: "DEADLINE" | "NHAC_NHO";
};

export type BanGhiThongBaoNhacDeadline = {
  maThongBao: string;
  maNguoiNhan: string;
};

/**
 * Cổng lưu thông báo nhắc deadline (loai_thong_bao = 'DEADLINE') và lấy FCM token
 * để tiến trình quét nhắc nhở đẩy thông báo tới người dùng.
 */
export interface KhoThongBaoNhacDeadline {
  taoNhieu(
    danhSach: DuLieuThongBaoNhacDeadline[],
    boThucThi?: BoThucThiTruyVan
  ): Promise<BanGhiThongBaoNhacDeadline[]>;
  layFcmTokenCuaNguoiNhan(userIds: string[], boThucThi?: BoThucThiTruyVan): Promise<FcmTokenNguoiNhan[]>;
  xoaFcmTokenKhongHopLe(tokens: string[], boThucThi?: BoThucThiTruyVan): Promise<void>;
}
