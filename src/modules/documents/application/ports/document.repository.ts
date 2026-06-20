import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type { CheDoHienThiTaiLieu, TaiLieu, TrangThaiTaiLieu } from "../../domain/document.js";

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

export interface KhoTaiLieu {
  tao(data: DuLieuTaoTaiLieu, boThucThi?: BoThucThiTruyVan): Promise<TaiLieu>;
  timTheoDuongDan(duongDanLuuTru: string, boThucThi?: BoThucThiTruyVan): Promise<TaiLieu | null>;
  kiemTraMonHocThuocSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<boolean>;
}
