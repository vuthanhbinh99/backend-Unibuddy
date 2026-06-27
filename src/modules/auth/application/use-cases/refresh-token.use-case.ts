import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoNguoiDung } from "../../../users/application/ports/user.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoPhienDangNhap } from "../ports/session.repository.js";
import type { DichVuToken } from "../ports/token.service.js";

export type LenhLamMoiToken = {
  refreshToken: string;
  device?: {
    fcmToken?: string | null;
    deviceType?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

export type KetQuaLamMoiToken = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
  khoPhienDangNhap: KhoPhienDangNhap;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuToken: DichVuToken;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyLamMoiToken {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhLamMoiToken): Promise<KetQuaLamMoiToken> {
    const bamTokenLamMoiCu = this.deps.dichVuToken.bamTokenLamMoi(command.refreshToken);
    const phienDangNhap = await this.deps.khoPhienDangNhap.timTheoBamTokenLamMoi(
      bamTokenLamMoiCu
    );

    if (!phienDangNhap) {
      throw LoiUngDung.khongDuocXacThuc("Làm mới token bị sai hoặc hết hạn");
    }

    const user = await this.deps.khoNguoiDung.timTheoMa(phienDangNhap.userId);

    if (!user) {
      throw LoiUngDung.khongDuocXacThuc("Người dùng sở hữu phiên đăng nhập không tồn tại");
    }

    if (user.status === "BI_KHOA") {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        await this.deps.khoPhienDangNhap.thuHoiPhienHoatDongTheoMaNguoiDung(user.id, tx);
        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: user.id,
            level: "WARNING",
            action: "AUTH_LOCKED_ACCOUNT_REFRESH_BLOCKED",
            tableName: "nguoi_dung",
            recordId: user.id,
            message: "Tài khoản đã bị khóa cố gắng làm mới token"
          },
          tx
        );
      });

      throw LoiUngDung.biKhoa("Tài khoản đã bị khóa và không thể làm mới token");
    }

    if (user.status === "CHO_DOI_MAT_KHAU") {
      throw LoiUngDung.khongCoQuyen("Tài khoản phải đổi mật khẩu trước khi làm mới token");
    }

    const accessToken = this.deps.dichVuToken.kyTokenTruyCap({
      id: user.id,
      email: user.email,
      roleCode: user.role.code
    });

    const tokenLamMoiMoi = this.deps.dichVuToken.taoTokenLamMoi();
    const tokenLamMoiMoiHash = this.deps.dichVuToken.bamTokenLamMoi(tokenLamMoiMoi);
    const refreshTokenExpiresAt = this.deps.dichVuToken.layThoiGianHetHanTokenLamMoi();

    await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      await this.deps.khoPhienDangNhap.thuHoiTheoBamTokenLamMoi(bamTokenLamMoiCu, tx);

      if (command.device?.fcmToken) {
        await this.deps.khoPhienDangNhap.lamSachFcmToken(command.device.fcmToken, tx);
      }

      await this.deps.khoPhienDangNhap.tao(
        {
          userId: user.id,
          refreshTokenHash: tokenLamMoiMoiHash,
          fcmToken: command.device?.fcmToken ?? phienDangNhap.fcmToken,
          deviceType: command.device?.deviceType ?? phienDangNhap.deviceType,
          ipAddress: command.device?.ipAddress ?? phienDangNhap.ipAddress,
          userAgent: command.device?.userAgent ?? phienDangNhap.userAgent,
          expiresAt: refreshTokenExpiresAt
        },
        tx
      );

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: user.id,
          level: "INFO",
          action: "AUTH_REFRESH_SUCCESS",
          tableName: "phien_dang_nhap",
          message: "Người dùng đã làm mới phiên xác thực thành công"
        },
        tx
      );
    });

    return {
      accessToken,
      refreshToken: tokenLamMoiMoi,
      refreshTokenExpiresAt
    };
  }
}



