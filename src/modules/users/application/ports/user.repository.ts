import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type { NguoiDung, TrangThaiNguoiDung } from "../../domain/user.js";

export type DuLieuTaoNguoiDung = {
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  status?: TrangThaiNguoiDung;
  roleCode: string;
};

export interface KhoNguoiDung {
  timTheoEmail(email: string, boThucThi?: BoThucThiTruyVan): Promise<NguoiDung | null>;
  timTheoMa(id: string, boThucThi?: BoThucThiTruyVan): Promise<NguoiDung | null>;
  tao(data: DuLieuTaoNguoiDung, boThucThi?: BoThucThiTruyVan): Promise<NguoiDung>;
}



