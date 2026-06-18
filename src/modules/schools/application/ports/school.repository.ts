import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type { TruongHoc } from "../../domain/school.js";

export type DuLieuTaoTruongHoc = {
  maTruongCode: string;
  tenTruong: string;
};

export type DuLieuCapNhatTruongHoc = {
  maTruongCode: string;
  tenTruong: string;
};

export interface KhoTruongHoc {
  lietKe(boThucThi?: BoThucThiTruyVan): Promise<TruongHoc[]>;
  timTheoMa(maTruongCode: string, boThucThi?: BoThucThiTruyVan): Promise<TruongHoc | null>;
  demSoHoSoSinhVienTheoMaTruongCode(
    maTruongCode: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<number>;
  tao(data: DuLieuTaoTruongHoc, boThucThi?: BoThucThiTruyVan): Promise<TruongHoc>;
  capNhat(data: DuLieuCapNhatTruongHoc, boThucThi?: BoThucThiTruyVan): Promise<TruongHoc | null>;
  xoaDuLieuLienQuanTheoMaTruongCode(
    maTruongCode: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<void>;
  xoaTheoMa(maTruongCode: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
}
