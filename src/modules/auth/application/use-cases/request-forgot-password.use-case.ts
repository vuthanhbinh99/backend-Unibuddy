import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoNguoiDung } from "../../../users/application/ports/user.repository.js";
import type { DichVuGuiEmail } from "../../../../shared/email/email.provider.js";
import type { KhoTamDatLaiMatKhau } from "../ports/forgot-password-cache.js";
import {
  bamMaQuenMatKhau,
  taoMaQuenMatKhau,
  THOI_HAN_MA_QUEN_MAT_KHAU_MS,
  tinhThoiGianHetHan
} from "../services/forgot-password-reset.service.js";

export type LenhYeuCauQuenMatKhau = {
  email: string;
};

export type KetQuaYeuCauQuenMatKhau = {
  accepted: true;
};

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
  khoTamDatLaiMatKhau: KhoTamDatLaiMatKhau;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuGuiEmail: DichVuGuiEmail;
};

export class XuLyYeuCauQuenMatKhau {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhYeuCauQuenMatKhau): Promise<KetQuaYeuCauQuenMatKhau> {
    const email = command.email.trim().toLowerCase();
    const user = await this.deps.khoNguoiDung.timTheoEmail(email);

    if (!user) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: null,
        level: "WARNING",
        action: "AUTH_FORGOT_PASSWORD_CODE_REQUEST_IGNORED",
        tableName: "nguoi_dung",
        message: "Yêu cầu mã đặt lại mật khẩu cho email không tồn tại",
        metadata: {
          email,
          reason: "USER_NOT_FOUND"
        }
      });

      return { accepted: true };
    }

    if (user.status === "BI_KHOA") {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: user.id,
        level: "WARNING",
        action: "AUTH_FORGOT_PASSWORD_CODE_REQUEST_BLOCKED",
        tableName: "nguoi_dung",
        recordId: user.id,
        message: "Tài khoản bị khóa yêu cầu mã đặt lại mật khẩu",
        metadata: {
          email: user.email,
          reason: "ACCOUNT_LOCKED"
        }
      });

      return { accepted: true };
    }

    const code = taoMaQuenMatKhau();
    const expiresAt = tinhThoiGianHetHan(THOI_HAN_MA_QUEN_MAT_KHAU_MS);
    const codeHash = bamMaQuenMatKhau(email, code);

    this.deps.khoTamDatLaiMatKhau.luuMa({
      userId: user.id,
      email: user.email,
      codeHash,
      expiresAt
    });

    try {
      await this.deps.dichVuGuiEmail.gui({
        to: user.email,
        subject: "Mã đặt lại mật khẩu UniBuddy",
        text: `Mã xác thực đặt lại mật khẩu của bạn là ${code}. Mã hết hạn sau 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
        html: `<p>Mã xác thực đặt lại mật khẩu của bạn là <strong>${code}</strong>.</p><p>Mã hết hạn sau 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`
      });
    } catch (error) {
      this.deps.khoTamDatLaiMatKhau.xoaTheoEmail(user.email);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: user.id,
        level: "ERROR",
        action: "AUTH_FORGOT_PASSWORD_CODE_SEND_FAILED",
        tableName: "nguoi_dung",
        recordId: user.id,
        message: "Gửi email mã đặt lại mật khẩu thất bại",
        metadata: {
          email: user.email,
          reason: "EMAIL_SEND_FAILED"
        }
      });

      throw error;
    }

    await this.deps.khoNhatKyHeThong.tao({
      actorId: user.id,
      level: "INFO",
      action: "AUTH_FORGOT_PASSWORD_CODE_SENT",
      tableName: "nguoi_dung",
      recordId: user.id,
      message: "Hệ thống đã gửi mã đặt lại mật khẩu qua email",
      metadata: {
        email: user.email,
        expiresAt: expiresAt.toISOString()
      }
    });

    return { accepted: true };
  }
}
