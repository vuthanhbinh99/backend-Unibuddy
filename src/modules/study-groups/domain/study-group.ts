export type VaiTroNhomHocTap = "TRUONG_NHOM" | "THANH_VIEN";

export type NhomHocTap = {
  maNhom: string;
  nguoiTao: string;
  tenNhom: string;
  maMon: string | null;
  maTruong: number | null;
  maThamGia: string;
  linkNhomChat: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NhomHocTapCuaSinhVien = NhomHocTap & {
  vaiTroTrongNhom: VaiTroNhomHocTap;
  thoiGianThamGia: Date;
  soThanhVien: number;
};

export type ThanhVienNhomHocTap = {
  maNhom: string;
  maNguoiDung: string;
  vaiTroTrongNhom: VaiTroNhomHocTap;
  thoiGianThamGia: Date;
  hoTen: string;
  email: string;
};
