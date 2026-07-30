import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
  Deadline,
  DuLieuTaoDeadline,
  MonHocDeadline,
  NhacNhoDeadline,
  TrangThaiDeadline
} from "../../domain/deadline.js";

export type BoLocDeadline = {
  actorId: string;
  maMonHoc?: string;
  trangThai?: TrangThaiDeadline;
};

export type DuLieuTaoNhacNhoDeadline = {
  maNguoiDung: string;
  maDeadline: string;
  thoiGianNhac: Date[];
};

export type NhacNhoDenHan = {
  maNhacNho: string;
  maNguoiDung: string;
  maDeadline: string;
  thoiGianNhac: Date;
  tieuDe: string;
  tenMon: string;
  hanNop: Date;
};

export interface KhoDeadline {
  lietKe(boLoc: BoLocDeadline, boThucThi?: BoThucThiTruyVan): Promise<Deadline[]>;
  timTheoMaCuaSinhVien(
    maDeadline: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<Deadline | null>;
  timMonHocCuaSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<MonHocDeadline | null>;
  tao(data: DuLieuTaoDeadline, boThucThi?: BoThucThiTruyVan): Promise<Deadline>;
  taoNhacNhoNhieu(data: DuLieuTaoNhacNhoDeadline, boThucThi?: BoThucThiTruyVan): Promise<NhacNhoDeadline[]>;
  /**
   * Nhận và khóa các nhắc nhở đã tới hạn nhưng chưa gửi (thoi_gian_da_gui IS NULL).
   * Đánh dấu ngay `thoi_gian_da_gui = NOW()` trong cùng truy vấn để tránh gửi trùng
   * khi có nhiều tiến trình quét song song.
   */
  nhanNhacNhoDenHanVaKhoa(gioiHan: number, boThucThi?: BoThucThiTruyVan): Promise<NhacNhoDenHan[]>;
  /**
   * Trả nhắc nhở về trạng thái chưa gửi khi việc gửi thông báo thất bại,
   * để lần quét sau thử lại.
   */
  danhDauNhacNhoChuaGui(maNhacNhos: string[], boThucThi?: BoThucThiTruyVan): Promise<void>;
  capNhatTrangThai(
    maDeadline: string,
    trangThai: TrangThaiDeadline,
    boThucThi?: BoThucThiTruyVan
  ): Promise<Deadline | null>;
  xoaNhacNhoTheoDeadline(maDeadline: string, boThucThi?: BoThucThiTruyVan): Promise<number>;
  xoa(maDeadline: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
}
