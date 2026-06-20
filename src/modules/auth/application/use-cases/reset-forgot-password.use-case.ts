import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoNguoiDung } from "../../../users/application/ports/user.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoTamDatLaiMatKhau } from "../ports/forgot-password-cache.js";
import type { BoMaHoaMatKhau } from "../ports/password-hasher.js";
import type { KhoPhienDangNhap } from "../ports/session.repository.js";
import { bamTokenDatLaiMatKhau } from "../services/forgot-password-reset.service.js";

export type LenhDatLaiMatKhau = {
  resetToken: string;
  newPassword: string;
};

export type KetQuaDatLaiMatKhau = {
  reset: true;
};

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
  khoTamDatLaiMatKhau: KhoTamDatLaiMatKhau;
  khoPhienDangNhap: KhoPhienDangNhap;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  boMaHoaMatKhau: BoMaHoaMatKhau;
  giaoDich: BoQuanLyGiaoDich;
};

const loiTokenKhongHopLe = () =>
  LoiUngDung.khongDuocXacThuc("Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");

export class XuLyDatLaiMatKhau {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDatLaiMatKhau): Promise<KetQuaDatLaiMatKhau> {
    const resetTokenHash = bamTokenDatLaiMatKhau(command.resetToken);
    const trangThai = this.deps.khoTamDatLaiMatKhau.timTheoToken(resetTokenHash);

    if (!trangThai || !trangThai.resetTokenExpiresAt) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: null,
        level: "WARNING",
        action: "AUTH_FORGOT_PASSWORD_RESET_FAILED",
        tableName: "nguoi_dung",
        message: "Đặt lại mật khẩu thất bại do token không hợp lệ hoặc không còn trong cache",
        metadata: {
          reason: "TOKEN_NOT_FOUND"
        }
      });

      throw loiTokenKhongHopLe();
    }

    const userHienTai = await this.deps.khoNguoiDung.timTheoMa(trangThai.userId);

    if (!userHienTai) {
      this.deps.khoTamDatLaiMatKhau.xoaTheoEmail(trangThai.email);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: trangThai.userId,
        level: "WARNING",
        action: "AUTH_FORGOT_PASSWORD_RESET_FAILED",
        tableName: "nguoi_dung",
        recordId: trangThai.userId,
        message: "Đặt lại mật khẩu thất bại do tài khoản không còn tồn tại",
        metadata: {
          email: trangThai.email,
          reason: "USER_NOT_FOUND"
        }
      });

      throw loiTokenKhongHopLe();
    }

    if (userHienTai.status === "BI_KHOA") {
      this.deps.khoTamDatLaiMatKhau.xoaTheoEmail(trangThai.email);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: userHienTai.id,
        level: "WARNING",
        action: "AUTH_FORGOT_PASSWORD_RESET_BLOCKED",
        tableName: "nguoi_dung",
        recordId: userHienTai.id,
        message: "Tài khoản bị khóa đặt lại mật khẩu",
        metadata: {
          email: userHienTai.email,
          reason: "ACCOUNT_LOCKED"
        }
      });

      throw LoiUngDung.biKhoa("Tài khoản đã bị khóa và không thể đặt lại mật khẩu");
    }

    if (trangThai.resetTokenExpiresAt.getTime() <= Date.now()) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: trangThai.userId,
        level: "WARNING",
        action: "AUTH_FORGOT_PASSWORD_RESET_FAILED",
        tableName: "nguoi_dung",
        recordId: trangThai.userId,
        message: "Token đặt lại mật khẩu đã hết hạn",
        metadata: {
          email: trangThai.email,
          reason: "TOKEN_EXPIRED"
        }
      });

      this.deps.khoTamDatLaiMatKhau.xoaTheoEmail(trangThai.email);
      throw loiTokenKhongHopLe();
    }

    const passwordHash = await this.deps.boMaHoaMatKhau.bam(command.newPassword);

    await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      await this.deps.khoPhienDangNhap.thuHoiPhienHoatDongTheoMaNguoiDung(
        trangThai.userId,
        tx
      );

      const user = await this.deps.khoNguoiDung.capNhatMatKhau(
        {
          userId: trangThai.userId,
          passwordHash,
          status: "HOAT_DONG",
          temporaryPasswordCreatedAt: null
        },
        tx
      );

      if (!user) {
        throw LoiUngDung.khongTimThay("Không tìm thấy tài khoản cần đặt lại mật khẩu");
      }

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: trangThai.userId,
          level: "INFO",
          action: "AUTH_FORGOT_PASSWORD_RESET_SUCCESS",
          tableName: "nguoi_dung",
          recordId: trangThai.userId,
          message: "Người dùng đặt lại mật khẩu thành công"
        },
        tx
      );
    });

    this.deps.khoTamDatLaiMatKhau.xoaTheoEmail(trangThai.email);

    return { reset: true };
  }
}
