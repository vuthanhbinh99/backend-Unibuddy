import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
  BinhLuanCongViecKanban,
  CongViecKanban,
  NguoiThamGiaKanban,
  NhomKanban,
  TrangThaiCongViecKanban
} from "../../domain/kanban.js";

export type DuLieuTaoCongViecKanban = {
  maNhom: string;
  tieuDe: string;
  moTa: string | null;
  hanHoanThanh: Date | null;
  nguoiDuocGiao: string | null;
  trangThai: TrangThaiCongViecKanban;
};

export type DuLieuCapNhatCongViecKanban = {
  tieuDe: string;
  moTa: string | null;
  hanHoanThanh: Date | null;
};

export type DuLieuCapNhatTrangThaiKanban = {
  maCongViec: string;
  maNhom: string;
  trangThaiCu: TrangThaiCongViecKanban;
  trangThaiMoi: TrangThaiCongViecKanban;
  viTriCu: number;
  viTriMoi?: number | null;
};

export type DuLieuTaoBinhLuanKanban = {
  maCongViec: string;
  maNguoiDung: string;
  noiDung: string;
};

export type DuLieuTaoThongBaoKanban = {
  actorId: string;
  nguoiNhanIds: string[];
  tieuDe: string;
  noiDung: string;
  maCongViec?: string | null;
};

export type DuLieuXoaThongBaoCongViecKanban = {
  maCongViec: string;
  maNhom: string;
  tieuDeCongViec: string;
};

export interface KhoKanban {
  coHoTroViTriCongViec(boThucThi?: BoThucThiTruyVan): Promise<boolean>;
  timNhom(maNhom: string, boThucThi?: BoThucThiTruyVan): Promise<NhomKanban | null>;
  timThanhVien(maNhom: string, maNguoiDung: string, boThucThi?: BoThucThiTruyVan): Promise<NguoiThamGiaKanban | null>;
  lietKeThanhVien(maNhom: string, boThucThi?: BoThucThiTruyVan): Promise<NguoiThamGiaKanban[]>;
  lietKeTruongNhom(maNhom: string, boThucThi?: BoThucThiTruyVan): Promise<NguoiThamGiaKanban[]>;
  lietKeCongViecTheoNhom(maNhom: string, boThucThi?: BoThucThiTruyVan): Promise<CongViecKanban[]>;
  timCongViec(maCongViec: string, boThucThi?: BoThucThiTruyVan, forUpdate?: boolean): Promise<CongViecKanban | null>;
  taoCongViec(data: DuLieuTaoCongViecKanban, boThucThi?: BoThucThiTruyVan): Promise<CongViecKanban>;
  capNhatThongTinCongViec(
    maCongViec: string,
    data: DuLieuCapNhatCongViecKanban,
    boThucThi?: BoThucThiTruyVan
  ): Promise<CongViecKanban | null>;
  capNhatNguoiDuocGiao(
    maCongViec: string,
    nguoiDuocGiao: string | null,
    boThucThi?: BoThucThiTruyVan
  ): Promise<CongViecKanban | null>;
  capNhatTrangThaiVaViTri(
    data: DuLieuCapNhatTrangThaiKanban,
    boThucThi?: BoThucThiTruyVan
  ): Promise<CongViecKanban | null>;
  capNhatCongViecTreHanTheoNhom(maNhom: string, boThucThi?: BoThucThiTruyVan): Promise<number>;
  timBinhLuan(maBinhLuan: string, boThucThi?: BoThucThiTruyVan): Promise<BinhLuanCongViecKanban | null>;
  xoaBinhLuan(maBinhLuan: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
  xoaBinhLuanTheoCongViec(maCongViec: string, boThucThi?: BoThucThiTruyVan): Promise<number>;
  danhDauXoaTaiLieuTheoCongViec(maCongViec: string, boThucThi?: BoThucThiTruyVan): Promise<number>;
  xoaThongBaoTheoCongViec(data: DuLieuXoaThongBaoCongViecKanban, boThucThi?: BoThucThiTruyVan): Promise<number>;
  xoaCongViec(maCongViec: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
  taoBinhLuan(data: DuLieuTaoBinhLuanKanban, boThucThi?: BoThucThiTruyVan): Promise<BinhLuanCongViecKanban>;
  taoThongBaoNhieu(data: DuLieuTaoThongBaoKanban, boThucThi?: BoThucThiTruyVan): Promise<void>;
}
