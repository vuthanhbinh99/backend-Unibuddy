import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { taoMatKhauTamSecure } from "../../../../shared/security/secure-password.js";
import type { BoMaHoaMatKhau } from "../../../auth/application/ports/password-hasher.js";
import type { KhoNguoiDung } from "../ports/user.repository.js";
import { anhXaNguoiDungQuanTri, type NguoiDungQuanTri } from "../../domain/user.js";

const THOI_HAN_MAT_KHAU_TAM_MS = 24 * 60 * 60 * 1000;

export type LenhTaoTaiKhoanQuanTri = {
  actorId: string | null;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  roleCode?: "ADMIN" | "QUAN_TRI_VIEN";
};

export type KetQuaTaoTaiKhoanQuanTri = {
  user: NguoiDungQuanTri;
  temporaryPassword: string;
  temporaryPasswordExpiresAt: Date;
};

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  boMaHoaMatKhau: BoMaHoaMatKhau;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyTaoTaiKhoanQuanTri {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoTaiKhoanQuanTri): Promise<KetQuaTaoTaiKhoanQuanTri> {
    const emailTonTai = await this.deps.khoNguoiDung.timTheoEmail(command.email);

    if (emailTonTai) {
      throw LoiUngDung.xungDot("Email này đã được sử dụng");
    }

    const tempPassword = taoMatKhauTamSecure(12, 16);
    const tempPasswordIssuedAt = new Date();
    const tempPasswordExpiresAt = new Date(tempPasswordIssuedAt.getTime() + THOI_HAN_MAT_KHAU_TAM_MS);
    const passwordHash = await this.deps.boMaHoaMatKhau.bam(tempPassword);

    return this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      const user = await this.deps.khoNguoiDung.tao(
        {
          email: command.email,
          passwordHash,
          fullName: command.fullName,
          phoneNumber: command.phoneNumber ?? null,
          avatarUrl: command.avatarUrl ?? null,
          roleCode: command.roleCode ?? "ADMIN",
          status: "CHO_DOI_MAT_KHAU",
          temporaryPasswordCreatedAt: tempPasswordIssuedAt
        },
        tx
      );

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId,
          level: "INFO",
          action: "ADMIN_ACCOUNT_CREATED",
          tableName: "nguoi_dung",
          recordId: user.id,
          message: "Quản trị viên đã tạo tài khoản admin mới",
          metadata: {
            email: command.email,
            roleCode: command.roleCode ?? "ADMIN"
          }
        },
        tx
      );

      return {
        user: anhXaNguoiDungQuanTri(user),
        temporaryPassword: tempPassword,
        temporaryPasswordExpiresAt: tempPasswordExpiresAt
      };
    });
  }
}