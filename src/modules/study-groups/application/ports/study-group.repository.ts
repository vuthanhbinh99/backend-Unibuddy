import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
  NhomHocTap,
  NhomHocTapCuaSinhVien,
  ThanhVienNhomHocTap,
  VaiTroNhomHocTap
} from "../../domain/study-group.js";

export type DuLieuTaoNhomHocTap = {
  nguoiTao: string;
  tenNhom: string;
  maMon: string;
  maTruong: number;
  maThamGia: string;
  linkNhomChat: string;
};

export type PhamViMonHocNhomHocTap = {
  maMon: string | null;
  maTruong: number | null;
};

export type DuLieuTaoThongBaoNhomHocTap = {
  actorId: string | null;
  nguoiNhanIds: string[];
  tieuDe: string;
  noiDung: string;
};

export interface KhoNhomHocTap {
  lietKeTheoThanhVien(maNguoiDung: string, boThucThi?: BoThucThiTruyVan): Promise<NhomHocTapCuaSinhVien[]>;
  timTheoMa(maNhom: string, boThucThi?: BoThucThiTruyVan): Promise<NhomHocTap | null>;
  timTheoMaThamGia(maThamGia: string, boThucThi?: BoThucThiTruyVan): Promise<NhomHocTap | null>;
  kiemTraTenNhomDaTonTai(
    tenNhom: string,
    phamVi: PhamViMonHocNhomHocTap,
    boThucThi?: BoThucThiTruyVan
  ): Promise<boolean>;
  kiemTraMaThamGiaDaTonTai(maThamGia: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
  taoNhom(data: DuLieuTaoNhomHocTap, boThucThi?: BoThucThiTruyVan): Promise<NhomHocTap>;
  themThanhVien(
    maNhom: string,
    maNguoiDung: string,
    vaiTro: VaiTroNhomHocTap,
    boThucThi?: BoThucThiTruyVan
  ): Promise<ThanhVienNhomHocTap>;
  timThanhVien(
    maNhom: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<ThanhVienNhomHocTap | null>;
  lietKeThanhVien(maNhom: string, boThucThi?: BoThucThiTruyVan): Promise<ThanhVienNhomHocTap[]>;
  lietKeTruongNhom(maNhom: string, boThucThi?: BoThucThiTruyVan): Promise<ThanhVienNhomHocTap[]>;
  capNhatCongViecCuaThanhVienThanhChuaGan(
    maNhom: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<number>;
  xoaThanhVien(maNhom: string, maNguoiDung: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
  xoaBinhLuanCongViecTheoNhom(maNhom: string, boThucThi?: BoThucThiTruyVan): Promise<number>;
  xoaCongViecTheoNhom(maNhom: string, boThucThi?: BoThucThiTruyVan): Promise<number>;
  xoaThanhVienTheoNhom(maNhom: string, boThucThi?: BoThucThiTruyVan): Promise<number>;
  xoaNhom(maNhom: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
  taoThongBaoNhieu(data: DuLieuTaoThongBaoNhomHocTap, boThucThi?: BoThucThiTruyVan): Promise<void>;
}
