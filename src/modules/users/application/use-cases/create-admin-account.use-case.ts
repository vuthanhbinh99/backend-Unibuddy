import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { taoMatKhauTamSecure } from "../../../../shared/security/secure-password.js";
import type { BoMaHoaMatKhau } from "../../../auth/application/ports/password-hasher.js";
import type { DichVuGuiEmail } from "../../../../shared/email/email.provider.js";
import type { KhoNguoiDung } from "../ports/user.repository.js";
import { anhXaNguoiDungQuanTri, type NguoiDungQuanTri } from "../../domain/user.js";

const THOI_HAN_MAT_KHAU_TAM_MS = 24 * 60 * 60 * 1000;

export type LenhTaoTaiKhoanQuanTri = {
  actorId: string | null;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  roleCode: string;
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
  dichVuGuiEmail: DichVuGuiEmail;
};

export class XuLyTaoTaiKhoanQuanTri {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoTaiKhoanQuanTri): Promise<KetQuaTaoTaiKhoanQuanTri> {
    const userDaTonTai = await this.deps.khoNguoiDung.timTheoEmail(command.email);

    if (userDaTonTai) {
      throw LoiUngDung.xungDot("Email người dùng đã tồn tại");
    }

    const matKhauTam = taoMatKhauTamSecure();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + THOI_HAN_MAT_KHAU_TAM_MS);
    const passwordHash = await this.deps.boMaHoaMatKhau.bam(matKhauTam);

    const user = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      const createdUser = await this.deps.khoNguoiDung.tao(
        {
          email: command.email,
          passwordHash,
          fullName: command.fullName,
          phoneNumber: command.phoneNumber ?? null,
          avatarUrl: command.avatarUrl ?? null,
          status: "CHO_DOI_MAT_KHAU",
          roleCode: command.roleCode,
          temporaryPasswordCreatedAt: createdAt
        },
        tx
      );

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId,
          level: "INFO",
          action: "ADMIN_ACCOUNT_CREATED",
          tableName: "nguoi_dung",
          recordId: createdUser.id,
          message: "Quản trị viên tạo tài khoản admin mới",
          metadata: {
            email: command.email,
            roleCode: command.roleCode,
            temporaryPasswordCreatedAt: createdAt.toISOString()
          }
        },
        tx
      );

      return createdUser;
    });

    await this.deps.dichVuGuiEmail.gui({
      to: command.email,
      subject: "Thông tin tài khoản quản trị viên tạm thời",
      text: `Tài khoản của bạn đã được tạo. Mật khẩu tạm: ${matKhauTam}. Mật khẩu này hết hạn sau 24 giờ và bạn phải đổi ngay khi đăng nhập.`,
      html: `<p>Tài khoản của bạn đã được tạo.</p><p><strong>Mật khẩu tạm:</strong> ${matKhauTam}</p><p>Mật khẩu này hết hạn sau 24 giờ và bạn phải đổi ngay khi đăng nhập.</p>`
    });

    return {
      user: anhXaNguoiDungQuanTri(user),
      temporaryPassword: matKhauTam,
      temporaryPasswordExpiresAt: expiresAt
    };
  }
}