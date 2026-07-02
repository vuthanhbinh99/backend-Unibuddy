import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
  CheDoHienThiTaiLieu,
  TaiLieu,
  TaiLieuLuuTruSinhVien,
  TrangThaiTaiLieu
} from "../../domain/document.js";

export type DuLieuTaoTaiLieu = {
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
};

export type BoLocDanhSachTaiLieuSinhVien = {
  maNguoiDung: string;
  query?: string;
  limit: number;
  offset: number;
};

export type KetQuaDanhSachTaiLieuSinhVien = {
  items: TaiLieuLuuTruSinhVien[];
  total: number;
  totalBytes: number;
};

export interface KhoTaiLieu {
  tao(data: DuLieuTaoTaiLieu, boThucThi?: BoThucThiTruyVan): Promise<TaiLieu>;
  timTheoDuongDan(duongDanLuuTru: string, boThucThi?: BoThucThiTruyVan): Promise<TaiLieu | null>;
  lietKeChoSinhVien(
    boLoc: BoLocDanhSachTaiLieuSinhVien,
    boThucThi?: BoThucThiTruyVan
  ): Promise<KetQuaDanhSachTaiLieuSinhVien>;
  danhDauXoaCuaSinhVien(maTaiLieu: string, maNguoiDung: string, boThucThi?: BoThucThiTruyVan): Promise<TaiLieu | null>;
  kiemTraMonHocThuocSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<boolean>;
}
