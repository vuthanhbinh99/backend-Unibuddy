export const CAC_TRANG_THAI_DEADLINE = ["CHUA_LAM", "DANG_LAM", "HOAN_THANH", "TRE_HAN"] as const;

export type TrangThaiDeadline = (typeof CAC_TRANG_THAI_DEADLINE)[number];

export type Deadline = {
  maDeadline: string;
  maMonHoc: string;
  maNguoiDung: string;
  maHocKy: string;
  maMon: string | null;
  tenMon: string;
  tieuDe: string;
  moTa: string | null;
  hanNop: Date;
  trangThai: TrangThaiDeadline;
  soNhacNho: number;
  createdAt: Date;
  updatedAt: Date;
};

export type MonHocDeadline = {
  maMonHoc: string;
  maNguoiDung: string;
  maHocKy: string;
  maMon: string | null;
  tenMon: string;
};

export type NhacNhoDeadline = {
  maNhacNho: string;
  maNguoiDung: string;
  maDeadline: string;
  thoiGianNhac: Date;
  thoiGianDaGui: Date | null;
  createdAt: Date;
};

export type DuLieuTaoDeadline = {
  maMonHoc: string;
  tieuDe: string;
  moTa: string | null;
  hanNop: Date;
  trangThai: TrangThaiDeadline;
};

export type ThongKeTrangThaiDeadline = {
  chuaLam: number;
  dangLam: number;
  hoanThanh: number;
  treHan: number;
};

export const laTrangThaiDeadline = (value: string): value is TrangThaiDeadline =>
  CAC_TRANG_THAI_DEADLINE.includes(value as TrangThaiDeadline);
