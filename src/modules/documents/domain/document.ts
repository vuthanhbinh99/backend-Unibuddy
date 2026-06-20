export type CheDoHienThiTaiLieu = "CONG_KHAI" | "RIENG_TU" | "CHIA_SE_NHOM";

export type TrangThaiTaiLieu = "KHA_DUNG" | "DA_XOA" | "CHO_KIEM_DUYET";

export type TaiLieu = {
  maTaiLieu: string;
  nguoiTaiLen: string;
  maMonHoc: string | null;
  maNhom: string | null;
  maGhiChu: string | null;
  duongDanLuuTru: string;
  tenFile: string;
  loaiFile: string | null;
  dungLuong: number | null;
  cheDoHienThi: CheDoHienThiTaiLieu;
  trangThai: TrangThaiTaiLieu;
  createdAt: Date;
  updatedAt: Date;
};
