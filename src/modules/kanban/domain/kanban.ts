import type { VaiTroNhomHocTap } from "../../study-groups/domain/study-group.js";

export const CAC_TRANG_THAI_CONG_VIEC_KANBAN = [
  "CHUA_BAT_DAU",
  "DANG_THUC_HIEN",
  "HOAN_THANH",
  "TRE_HAN"
] as const;

export const CAC_TRANG_THAI_CONG_VIEC_NGUOI_DUNG_DUOC_CHUYEN = [
  "CHUA_BAT_DAU",
  "DANG_THUC_HIEN",
  "HOAN_THANH"
] as const;

export type TrangThaiCongViecKanban = (typeof CAC_TRANG_THAI_CONG_VIEC_KANBAN)[number];
export type TrangThaiCongViecNguoiDungDuocChuyen = (typeof CAC_TRANG_THAI_CONG_VIEC_NGUOI_DUNG_DUOC_CHUYEN)[number];

export type NguoiThamGiaKanban = {
  maNguoiDung: string;
  hoTen: string;
  email: string;
  vaiTroTrongNhom: VaiTroNhomHocTap;
};

export type NhomKanban = {
  maNhom: string;
  tenNhom: string;
  linkNhomChat: string;
};

export type CongViecKanban = {
  maCongViec: string;
  maNhom: string;
  nguoiDuocGiao: string | null;
  nguoiDuocGiaoHoTen: string | null;
  nguoiDuocGiaoEmail: string | null;
  tieuDe: string;
  moTa: string | null;
  trangThai: TrangThaiCongViecKanban;
  hanHoanThanh: Date | null;
  viTri: number;
  soBinhLuan: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BinhLuanCongViecKanban = {
  maBinhLuan: string;
  maCongViec: string;
  maNguoiDung: string;
  hoTen: string;
  email: string;
  noiDung: string;
  createdAt: Date;
};
