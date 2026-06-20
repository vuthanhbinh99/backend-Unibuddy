import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoNguoiDung } from "../../../users/application/ports/user.repository.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type {
  KhoTamDatLaiMatKhau,
  TrangThaiQuenMatKhauTam
} from "../ports/forgot-password-cache.js";
import {
  bamMaQuenMatKhau,
  bamTokenDatLaiMatKhau,
  hashBangNhauBaoMat,
  SO_LAN_NHAP_SAI_MA_QUEN_MAT_KHAU_TOI_DA,
  taoTokenDatLaiMatKhau,
  THOI_HAN_TOKEN_DAT_LAI_MAT_KHAU_MS,
  tinhThoiGianHetHan
} from "../services/forgot-password-reset.service.js";

export type LenhXacThucMaQuenMatKhau = {
  email: string;
  code: string;
};

export type KetQuaXacThucMaQuenMatKhau = {
  resetToken: string;
  expiresAt: Date;
};

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
  khoTamDatLaiMatKhau: KhoTamDatLaiMatKhau;
  khoNhatKyHeThong: KhoNhatKyHeThong;
};

const loiMaKhongHopLe = () =>
  LoiUngDung.khongDuocXacThuc("Mã xác thực không hợp lệ hoặc đã hết hạn");

export class XuLyXacThucMaQuenMatKhau {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXacThucMaQuenMatKhau): Promise<KetQuaXacThucMaQuenMatKhau> {
    const email = command.email.trim().toLowerCase();
    const trangThai = this.deps.khoTamDatLaiMatKhau.timTheoEmail(email);

    if (!trangThai) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: null,
        level: "WARNING",
        action: "AUTH_FORGOT_PASSWORD_VERIFY_FAILED",
        tableName: "nguoi_dung",
        message: "Xác thực mã đặt lại mật khẩu thất bại do không có mã hợp lệ trong cache",
        metadata: {
          email,
          reason: "NO_ACTIVE_CODE"
        }
      });

      throw loiMaKhongHopLe();
    }

    const user = await this.deps.khoNguoiDung.timTheoMa(trangThai.userId);

    if (!user) {
      this.deps.khoTamDatLaiMatKhau.xoaTheoEmail(email);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: trangThai.userId,
        level: "WARNING",
        action: "AUTH_FORGOT_PASSWORD_VERIFY_FAILED",
        tableName: "nguoi_dung",
        recordId: trangThai.userId,
        message: "Xác thực mã đặt lại mật khẩu thất bại do tài khoản không còn tồn tại",
        metadata: {
          email,
          reason: "USER_NOT_FOUND"
        }
      });

      throw loiMaKhongHopLe();
    }

    if (user.status === "BI_KHOA") {
      this.deps.khoTamDatLaiMatKhau.xoaTheoEmail(email);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: user.id,
        level: "WARNING",
        action: "AUTH_FORGOT_PASSWORD_VERIFY_BLOCKED",
        tableName: "nguoi_dung",
        recordId: user.id,
        message: "Tài khoản bị khóa xác thực mã đặt lại mật khẩu",
        metadata: {
          email: user.email,
          reason: "ACCOUNT_LOCKED"
        }
      });

      throw LoiUngDung.biKhoa("Tài khoản đã bị khóa và không thể đặt lại mật khẩu");
    }

    const now = new Date();
    const daHetHan = trangThai.codeExpiresAt.getTime() <= now.getTime();
    const daVuotSoLanThu =
      trangThai.failedAttempts >= SO_LAN_NHAP_SAI_MA_QUEN_MAT_KHAU_TOI_DA;

    if (daHetHan || daVuotSoLanThu) {
      await this.ghiAuditXacThucThatBai(trangThai, daHetHan ? "EXPIRED" : "UNAVAILABLE");
      this.deps.khoTamDatLaiMatKhau.xoaTheoEmail(email);
      throw loiMaKhongHopLe();
    }

    const codeHash = bamMaQuenMatKhau(email, command.code);
    const codeDung = hashBangNhauBaoMat(trangThai.codeHash, codeHash);

    if (!codeDung) {
      const capNhat = this.deps.khoTamDatLaiMatKhau.tangSoLanNhapSai(email);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: trangThai.userId,
        level: "WARNING",
        action: "AUTH_FORGOT_PASSWORD_VERIFY_FAILED",
        tableName: "nguoi_dung",
        recordId: trangThai.userId,
        message: "Người dùng nhập sai mã đặt lại mật khẩu",
        metadata: {
          failedAttempts: capNhat?.failedAttempts ?? trangThai.failedAttempts + 1
        }
      });

      throw loiMaKhongHopLe();
    }

    const resetToken = taoTokenDatLaiMatKhau();
    const resetTokenHash = bamTokenDatLaiMatKhau(resetToken);
    const expiresAt = tinhThoiGianHetHan(THOI_HAN_TOKEN_DAT_LAI_MAT_KHAU_MS, now);

    this.deps.khoTamDatLaiMatKhau.luuToken({
      email,
      resetTokenHash,
      expiresAt
    });

    await this.deps.khoNhatKyHeThong.tao({
      actorId: trangThai.userId,
      level: "INFO",
      action: "AUTH_FORGOT_PASSWORD_VERIFY_SUCCESS",
      tableName: "nguoi_dung",
      recordId: trangThai.userId,
      message: "Người dùng xác thực mã đặt lại mật khẩu thành công",
      metadata: {
        expiresAt: expiresAt.toISOString()
      }
    });

    return {
      resetToken,
      expiresAt
    };
  }

  private async ghiAuditXacThucThatBai(
    trangThai: TrangThaiQuenMatKhauTam,
    reason: "EXPIRED" | "UNAVAILABLE"
  ) {
    await this.deps.khoNhatKyHeThong.tao({
      actorId: trangThai.userId,
      level: "WARNING",
      action: "AUTH_FORGOT_PASSWORD_VERIFY_FAILED",
      tableName: "nguoi_dung",
      recordId: trangThai.userId,
      message: "Mã đặt lại mật khẩu không còn hợp lệ",
      metadata: {
        reason,
        failedAttempts: trangThai.failedAttempts
      }
    });
  }
}
