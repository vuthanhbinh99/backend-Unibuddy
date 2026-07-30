import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";

export type TruongHocDangKy = {
  maTruong: number;
  maTruongCode: string;
  tenTruong: string;
};

export type HoSoSinhVienDangKy = {
  maNguoiDung: string;
  maSinhVien: string;
  maTruong: number | null;
  maTruongCode?: string | null;
  nganhHoc: string | null;
  khoaHoc: string | null;
};

export interface KhoDangKySinhVien {
  timTruongTheoMa(maTruong: number, boThucThi?: BoThucThiTruyVan): Promise<TruongHocDangKy | null>;
  timTruongTheoCode(maTruongCode: string, boThucThi?: BoThucThiTruyVan): Promise<TruongHocDangKy | null>;
  tonTaiMaSinhVien(
    maSinhVien: string,
    maTruong: number | null,
    loaiTruMaNguoiDung?: string | null,
    boThucThi?: BoThucThiTruyVan
  ): Promise<boolean>;
  timHoSoSinhVienTheoNguoiDung(
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<HoSoSinhVienDangKy | null>;
  taoHoSoSinhVien(data: HoSoSinhVienDangKy, boThucThi?: BoThucThiTruyVan): Promise<HoSoSinhVienDangKy>;
  capNhatMaSinhVien(
    maNguoiDung: string,
    maSinhVien: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<HoSoSinhVienDangKy | null>;
}
