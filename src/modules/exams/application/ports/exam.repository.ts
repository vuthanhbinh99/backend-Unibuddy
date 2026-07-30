import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
  DuLieuLichThi,
  LichThi,
  MonHocChoLichThi,
  NhacNhoLichThiDenHan
} from "../../domain/exam.js";

export type BoLocLichThi = {
  maMonHoc?: string;
};

export type BoLocMonHocImportLichThi = {
  maNguoiDung: string;
  maHocKy?: string | null;
  maMonHoc?: string | null;
  maMon?: string | null;
  tenMon?: string | null;
};

export interface KhoLichThi {
  lietKeTheoSinhVien(maNguoiDung: string, boLoc?: BoLocLichThi, boThucThi?: BoThucThiTruyVan): Promise<LichThi[]>;
  timTheoMaCuaSinhVien(
    maLichThi: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<LichThi | null>;
  timMonHocCuaSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<MonHocChoLichThi | null>;
  timMonHocChoImport(boLoc: BoLocMonHocImportLichThi, boThucThi?: BoThucThiTruyVan): Promise<MonHocChoLichThi[]>;
  tao(data: DuLieuLichThi, boThucThi?: BoThucThiTruyVan): Promise<LichThi>;
  taoNhieu(data: DuLieuLichThi[], boThucThi?: BoThucThiTruyVan): Promise<LichThi[]>;
  capNhat(maLichThi: string, data: DuLieuLichThi, boThucThi?: BoThucThiTruyVan): Promise<LichThi | null>;
  xoa(maLichThi: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
  xoaTheoMonHoc(dsMaMonHoc: string[], boThucThi?: BoThucThiTruyVan): Promise<number>;
  taoNhacNhoTruocMotNgay(
    maNguoiDung: string,
    maLichThi: string,
    thoiGianThi: Date,
    boThucThi?: BoThucThiTruyVan
  ): Promise<number>;
  xoaNhacNhoTheoLichThi(maLichThi: string, boThucThi?: BoThucThiTruyVan): Promise<number>;
  nhanNhacNhoLichThiDenHanVaKhoa(gioiHan: number, boThucThi?: BoThucThiTruyVan): Promise<NhacNhoLichThiDenHan[]>;
  danhDauNhacNhoChuaGui(maNhacNhos: string[], boThucThi?: BoThucThiTruyVan): Promise<void>;
}
