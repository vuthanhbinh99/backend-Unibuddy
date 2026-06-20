import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type { NguoiDung, NguoiDungQuanTri, TrangThaiNguoiDung } from "../../domain/user.js";

export type DuLieuTaoNguoiDung = {
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  status?: TrangThaiNguoiDung;
  roleCode: string;
  temporaryPasswordCreatedAt?: Date | null;
};

export type DuLieuCapNhatMatKhauNguoiDung = {
  userId: string;
  passwordHash: string;
  status: TrangThaiNguoiDung;
  temporaryPasswordCreatedAt?: Date | null;
};

export type DuLieuCapNhatVaiTroNguoiDung = {
  userId: string;
  roleCode: string;
};

export type DuLieuCapNhatTrangThaiNguoiDung = {
  userId: string;
  status: TrangThaiNguoiDung;
  temporaryPasswordCreatedAt?: Date | null;
};

export interface KhoNguoiDung {
  lietKe(boThucThi?: BoThucThiTruyVan): Promise<NguoiDungQuanTri[]>;
  timTheoEmail(email: string, boThucThi?: BoThucThiTruyVan): Promise<NguoiDung | null>;
  timTheoMa(id: string, boThucThi?: BoThucThiTruyVan): Promise<NguoiDung | null>;
  tao(data: DuLieuTaoNguoiDung, boThucThi?: BoThucThiTruyVan): Promise<NguoiDung>;
  capNhatMatKhau(data: DuLieuCapNhatMatKhauNguoiDung, boThucThi?: BoThucThiTruyVan): Promise<NguoiDung | null>;
  capNhatVaiTro(data: DuLieuCapNhatVaiTroNguoiDung, boThucThi?: BoThucThiTruyVan): Promise<NguoiDung | null>;
  capNhatTrangThai(
    data: DuLieuCapNhatTrangThaiNguoiDung,
    boThucThi?: BoThucThiTruyVan
  ): Promise<NguoiDung | null>;
}

