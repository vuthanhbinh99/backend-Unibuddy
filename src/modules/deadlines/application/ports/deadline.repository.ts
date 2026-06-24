import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
  Deadline,
  DuLieuTaoDeadline,
  MonHocDeadline,
  NhacNhoDeadline,
  TrangThaiDeadline
} from "../../domain/deadline.js";

export type BoLocDeadline = {
  actorId: string;
  maMonHoc?: string;
  trangThai?: TrangThaiDeadline;
};

export type DuLieuTaoNhacNhoDeadline = {
  maNguoiDung: string;
  maDeadline: string;
  thoiGianNhac: Date[];
};

export interface KhoDeadline {
  lietKe(boLoc: BoLocDeadline, boThucThi?: BoThucThiTruyVan): Promise<Deadline[]>;
  timTheoMaCuaSinhVien(
    maDeadline: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<Deadline | null>;
  timMonHocCuaSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<MonHocDeadline | null>;
  tao(data: DuLieuTaoDeadline, boThucThi?: BoThucThiTruyVan): Promise<Deadline>;
  taoNhacNhoNhieu(data: DuLieuTaoNhacNhoDeadline, boThucThi?: BoThucThiTruyVan): Promise<NhacNhoDeadline[]>;
  capNhatTrangThai(
    maDeadline: string,
    trangThai: TrangThaiDeadline,
    boThucThi?: BoThucThiTruyVan
  ): Promise<Deadline | null>;
  xoaNhacNhoTheoDeadline(maDeadline: string, boThucThi?: BoThucThiTruyVan): Promise<number>;
  xoa(maDeadline: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
}
