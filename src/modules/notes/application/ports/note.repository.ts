import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type { GhiChu, GhiChuChiTiet, GhiChuDanhSach, SapXepGhiChu, TepDinhKemGhiChu } from "../../domain/notes.js";

export type DuLieuTaoGhiChu = {
  maNguoiDung: string;
  maMonHoc: string | null;
  tieuDe: string;
  noiDung: string | null;
};

export type DuLieuCapNhatGhiChu = {
  maGhiChu: string;
  maMonHoc: string | null;
  tieuDe: string;
  noiDung: string | null;
};

export type DuLieuTaoTepDinhKemGhiChu = {
  maGhiChu: string;
  nguoiTaiLen: string;
  duongDanLuuTru: string;
  tenFile: string;
  loaiFile: string | null;
  dungLuong: number | null;
};

export type BoLocGhiChu = {
  maNguoiDung: string;
  tuKhoa?: string;
  maMonHoc?: string;
  sort: SapXepGhiChu;
  page: number;
  limit: number;
};

export type KetQuaDanhSachGhiChu = {
  items: GhiChuDanhSach[];
  total: number;
  page: number;
  limit: number;
};

export interface KhoGhiChu {
  lietKe(boLoc: BoLocGhiChu, boThucThi?: BoThucThiTruyVan): Promise<KetQuaDanhSachGhiChu>;
  timTheoMa(maGhiChu: string, boThucThi?: BoThucThiTruyVan): Promise<GhiChuChiTiet | null>;
  tao(data: DuLieuTaoGhiChu, boThucThi?: BoThucThiTruyVan): Promise<GhiChu>;
  capNhat(data: DuLieuCapNhatGhiChu, boThucThi?: BoThucThiTruyVan): Promise<GhiChu | null>;
  xoaTheoMa(maGhiChu: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
  taoTepDinhKem(data: DuLieuTaoTepDinhKemGhiChu, boThucThi?: BoThucThiTruyVan): Promise<TepDinhKemGhiChu>;
  kiemTraDuongDanTaiLieuDaTonTai(duongDanLuuTru: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
  danhDauXoaTepDinhKemTheoMaGhiChu(
    maGhiChu: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<number>;
  danhDauXoaTepDinhKemTheoDanhSach(
    maGhiChu: string,
    maNguoiDung: string,
    maTaiLieu: string[],
    boThucThi?: BoThucThiTruyVan
  ): Promise<number>;
  kiemTraMonHocThuocSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<boolean>;
}
