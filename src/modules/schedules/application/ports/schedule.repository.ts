import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
  DuLieuLichHoc,
  LichHoc,
  MonHocCuaSinhVien,
  NguCanhMonHocTrongLichSinhVien,
  XungDotLichHoc
} from "../../domain/schedule.js";

export type BoLocLichHoc = {
  maMonHoc?: string;
};

export type BoLocMonHocImport = {
  maNguoiDung: string;
  maHocKy?: string | null;
  maMonHoc?: string | null;
  maMon?: string | null;
  tenMon?: string | null;
};

export interface KhoLichHoc {
  lietKeTheoSinhVien(
    maNguoiDung: string,
    boLoc?: BoLocLichHoc,
    boThucThi?: BoThucThiTruyVan
  ): Promise<LichHoc[]>;
  timTheoMaCuaSinhVien(
    maLichHoc: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<LichHoc | null>;
  kiemTraMonHocThuocSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<boolean>;
  kiemTraHocKyThuocSinhVien(
    maHocKy: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<boolean>;
  demMonHocCuaSinhVien(maNguoiDung: string, boThucThi?: BoThucThiTruyVan): Promise<number>;
  layNguCanhMonHocTrongLichSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<NguCanhMonHocTrongLichSinhVien | null>;
  timMonHocChoImport(boLoc: BoLocMonHocImport, boThucThi?: BoThucThiTruyVan): Promise<MonHocCuaSinhVien[]>;
  timXungDot(
    maNguoiDung: string,
    data: DuLieuLichHoc,
    loaiTruMaLichHoc?: string | null,
    boThucThi?: BoThucThiTruyVan
  ): Promise<XungDotLichHoc[]>;
  tao(data: DuLieuLichHoc, boThucThi?: BoThucThiTruyVan): Promise<LichHoc>;
  capNhat(maLichHoc: string, data: DuLieuLichHoc, boThucThi?: BoThucThiTruyVan): Promise<LichHoc | null>;
  xoa(maLichHoc: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
  taoNhieu(dsLichHoc: DuLieuLichHoc[], boThucThi?: BoThucThiTruyVan): Promise<LichHoc[]>;
}
