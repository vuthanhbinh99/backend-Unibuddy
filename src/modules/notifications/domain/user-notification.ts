export type LoaiThongBaoNguoiDung = "HE_THONG" | "NHOM_HOC_TAP" | "DEADLINE";

export type BoLocThongBaoNguoiDung = {
  userId: string;
  onlyUnread: boolean;
  loaiThongBao: LoaiThongBaoNguoiDung | null;
  page: number;
  limit: number;
};

export type ThongBaoNguoiDung = {
  maThongBao: string;
  maNguoiNhan: string;
  nguoiTao: string | null;
  tieuDe: string;
  noiDung: string;
  loaiThongBao: string;
  maCongViec: string | null;
  thoiGianDaGui: Date | null;
  createdAt: Date;
  readAt: Date | null;
  isRead: boolean;
};

export type KetQuaDanhSachThongBaoNguoiDung = {
  message: string;
  items: ThongBaoNguoiDung[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
  readTrackingSupported: boolean;
};
