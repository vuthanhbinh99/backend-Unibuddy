import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { type NguoiDungCongKhai, anhXaNguoiDungCongKhai } from "../../../users/domain/user.js";
import type { KhoNguoiDung } from "../../../users/application/ports/user.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { BoMaHoaMatKhau } from "../ports/password-hasher.js";
import type { KhoPhienDangNhap } from "../ports/session.repository.js";
import type { DichVuToken } from "../ports/token.service.js";

export type LenhDangNhap = {
  email: string;
  password: string;
  device?: {
    fcmToken?: string | null;
    deviceType?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

export type KetQuaDangNhap = {
  user: NguoiDungCongKhai;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
  khoPhienDangNhap: KhoPhienDangNhap;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  boMaHoaMatKhau: BoMaHoaMatKhau;
  dichVuToken: DichVuToken;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyDangNhap {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDangNhap): Promise<KetQuaDangNhap> {
    const user = await this.deps.khoNguoiDung.timTheoEmail(command.email);

    if (!user) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: null,
        level: "WARNING",
        action: "AUTH_LOGIN_FAILED",
        tableName: "nguoi_dung",
        message: "Đăng nhập thất bại do tài khoản không tồn tại",
        metadata: { email: command.email }
      });
      throw LoiUngDung.khongDuocXacThuc("Sai tài khoản hoặc mật khẩu");
    }

    const isPasswordValid = await this.deps.boMaHoaMatKhau.soSanh(
      command.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: user.id,
        level: "WARNING",
        action: "AUTH_LOGIN_FAILED",
        tableName: "nguoi_dung",
        recordId: user.id,
        message: "Đăng nhập thất bại do mật khẩu không đúng"
      });
      throw LoiUngDung.khongDuocXacThuc("Sai tài khoản hoặc mật khẩu");
    }

    if (user.status === "BI_KHOA") {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        await this.deps.khoPhienDangNhap.thuHoiPhienHoatDongTheoMaNguoiDung(user.id, tx);
        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: user.id,
            level: "WARNING",
            action: "AUTH_LOCKED_ACCOUNT_LOGIN_BLOCKED",
            tableName: "nguoi_dung",
            recordId: user.id,
            message: "Tài khoản đã bị khóa cố gắng đăng nhập"
          },
          tx
        );
      });

      throw LoiUngDung.biKhoa("Tài khoản đã bị khóa và không thể đăng nhập");
    }

    const accessToken = this.deps.dichVuToken.kyTokenTruyCap({
      id: user.id,
      email: user.email,
      roleCode: user.role.code
    });

    const refreshToken = this.deps.dichVuToken.taoTokenLamMoi();
    const refreshTokenHash = this.deps.dichVuToken.bamTokenLamMoi(refreshToken);
    const refreshTokenExpiresAt = this.deps.dichVuToken.layThoiGianHetHanTokenLamMoi();

    await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      if (command.device?.fcmToken) {
        await this.deps.khoPhienDangNhap.lamSachFcmToken(command.device.fcmToken, tx);
      }

      await this.deps.khoPhienDangNhap.tao(
        {
          userId: user.id,
          refreshTokenHash,
          fcmToken: command.device?.fcmToken ?? null,
          deviceType: command.device?.deviceType ?? null,
          ipAddress: command.device?.ipAddress ?? null,
          userAgent: command.device?.userAgent ?? null,
          expiresAt: refreshTokenExpiresAt
        },
        tx
      );

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: user.id,
          level: "INFO",
          action: "AUTH_LOGIN_SUCCESS",
          tableName: "phien_dang_nhap",
          message: "Người dùng đăng nhập thành công"
        },
        tx
      );
    });

    return {
      user: anhXaNguoiDungCongKhai(user),
      accessToken,
      refreshToken,
      refreshTokenExpiresAt
    };
  }
}



