import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
  DuLieuCapNhatHocPhan,
  DuLieuTaoHocKy,
  DuLieuTaoHocPhan,
  HocKySinhVien,
  HocPhan,
  KetQuaTimHoacTaoHocPhanImport,
  ThongKeLienKetHocPhan
} from "../../domain/course.js";

export type BoLocDanhSachHocPhan = {
  maHocKy: string;
};

export type DuLieuTimTrungHocPhan = {
  actorId: string;
  maHocKy: string;
  maMon: string | null;
  tenMon: string;
  loaiTruMaMonHoc?: string | null;
};

export type DuLieuHocPhanImport = {
  actorId: string;
  maHocKy: string;
  maMon: string | null;
  tenMon: string;
  soTinChi?: number | null;
};

export interface KhoHocPhan {
  lietKeHocKy(maNguoiDung: string, boThucThi?: BoThucThiTruyVan): Promise<HocKySinhVien[]>;
  timHocKyTheoTen(
    maNguoiDung: string,
    tenHocKy: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<HocKySinhVien | null>;
  timHocKyCuaSinhVien(
    maHocKy: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<HocKySinhVien | null>;
  taoHocKy(data: DuLieuTaoHocKy, boThucThi?: BoThucThiTruyVan): Promise<HocKySinhVien>;
  lietKeTheoHocKy(
    maNguoiDung: string,
    boLoc: BoLocDanhSachHocPhan,
    boThucThi?: BoThucThiTruyVan
  ): Promise<HocPhan[]>;
  timTheoMaCuaSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<HocPhan | null>;
  timTrungLap(data: DuLieuTimTrungHocPhan, boThucThi?: BoThucThiTruyVan): Promise<HocPhan | null>;
  tao(data: DuLieuTaoHocPhan, boThucThi?: BoThucThiTruyVan): Promise<HocPhan>;
  capNhat(
    maMonHoc: string,
    data: DuLieuCapNhatHocPhan,
    boThucThi?: BoThucThiTruyVan
  ): Promise<HocPhan | null>;
  demLienKet(maMonHoc: string, boThucThi?: BoThucThiTruyVan): Promise<ThongKeLienKetHocPhan>;
  xoa(maMonHoc: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
  timHoacTaoChoImport(
    data: DuLieuHocPhanImport,
    boThucThi?: BoThucThiTruyVan
  ): Promise<KetQuaTimHoacTaoHocPhanImport>;
}
