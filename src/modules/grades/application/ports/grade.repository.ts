import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
  CauHinhTrongSoDiem,
  DuLieuTaoThanhPhanDiem,
  DuLieuUpsertThanhPhanDiem,
  HocKyDiemSo,
  MonHocDiemSo,
  MucQuyCheHocLuc,
  MucQuyDoiDiem,
  ThanhPhanDiem
} from "../../domain/grade.js";

export type BoLocBangDiem = {
  actorId: string;
  maHocKy?: string | null;
};

export type BoLocMonHocImportDiem = {
  actorId: string;
  maHocKy: string;
  maMonHoc?: string | null;
  maMon?: string | null;
  tenMon?: string | null;
};

export interface KhoDiemSo {
  timHocKyCuaSinhVien(maHocKy: string, actorId: string, boThucThi?: BoThucThiTruyVan): Promise<HocKyDiemSo | null>;
  lietKeHocKyCuaSinhVien(actorId: string, boThucThi?: BoThucThiTruyVan): Promise<HocKyDiemSo[]>;
  timMonHocCuaSinhVien(maMonHoc: string, actorId: string, boThucThi?: BoThucThiTruyVan): Promise<MonHocDiemSo | null>;
  timThanhPhanCuaSinhVien(
    maThanhPhan: string,
    actorId: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<(ThanhPhanDiem & { monHoc: MonHocDiemSo }) | null>;
  timThanhPhanTheoTen(maMonHoc: string, tenThanhPhan: string, boThucThi?: BoThucThiTruyVan): Promise<ThanhPhanDiem | null>;
  lietKeMonHocBangDiem(boLoc: BoLocBangDiem, boThucThi?: BoThucThiTruyVan): Promise<MonHocDiemSo[]>;
  lietKeThanhPhanTheoMon(maMonHoc: string, boThucThi?: BoThucThiTruyVan): Promise<ThanhPhanDiem[]>;
  timMonHocChoImport(boLoc: BoLocMonHocImportDiem, boThucThi?: BoThucThiTruyVan): Promise<MonHocDiemSo[]>;
  taoThanhPhan(data: DuLieuTaoThanhPhanDiem, boThucThi?: BoThucThiTruyVan): Promise<ThanhPhanDiem>;
  capNhatDiem(maThanhPhan: string, diem: number, boThucThi?: BoThucThiTruyVan): Promise<ThanhPhanDiem | null>;
  thayTheCauHinhTrongSo(maMonHoc: string, cauHinh: CauHinhTrongSoDiem[], boThucThi?: BoThucThiTruyVan): Promise<ThanhPhanDiem[]>;
  upsertThanhPhan(data: DuLieuUpsertThanhPhanDiem, boThucThi?: BoThucThiTruyVan): Promise<ThanhPhanDiem>;
  layMaTruongCodeSinhVien(actorId: string, boThucThi?: BoThucThiTruyVan): Promise<string | null>;
  layThangDiem(maTruongCode: string, boThucThi?: BoThucThiTruyVan): Promise<MucQuyDoiDiem[]>;
  layQuyCheHocLuc(maTruongCode: string, boThucThi?: BoThucThiTruyVan): Promise<MucQuyCheHocLuc[]>;
}

