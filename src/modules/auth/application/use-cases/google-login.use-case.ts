import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoNguoiDung } from "../../../users/application/ports/user.repository.js";
import { type NguoiDungCongKhai, anhXaNguoiDungCongKhai, type NguoiDung } from "../../../users/domain/user.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { BoKiemTraDanhTinhGoogle } from "../ports/google-identity-verifier.js";
import type { BoMaHoaMatKhau } from "../ports/password-hasher.js";
import type { KhoPhienDangNhap } from "../ports/session.repository.js";
import type { DichVuToken } from "../ports/token.service.js";

export type LenhDangNhapGoogle = {
  idToken: string;
  device?: {
    fcmToken?: string | null;
    deviceType?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

export type KetQuaDangNhapGoogle = {
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
  boKiemTraDanhTinhGoogle: BoKiemTraDanhTinhGoogle;
  maCodeVaiTroSinhVienMacDinh: string;
};

export class XuLyDangNhapGoogle {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDangNhapGoogle): Promise<KetQuaDangNhapGoogle> {
    const danhTinhGoogle = await this.deps.boKiemTraDanhTinhGoogle.xacThucIdToken(command.idToken);

    const user =
      (await this.deps.khoNguoiDung.timTheoEmail(danhTinhGoogle.email)) ??
      (await this.taoHocVienTuDanhTinhGoogle({
        email: danhTinhGoogle.email,
        fullName: danhTinhGoogle.fullName,
        avatarUrl: danhTinhGoogle.avatarUrl,
        googleSubject: danhTinhGoogle.subject
      }));

    if (user.status === "BI_KHOA") {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        await this.deps.khoPhienDangNhap.thuHoiPhienHoatDongTheoMaNguoiDung(user.id, tx);
        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: user.id,
            level: "WARNING",
            action: "AUTH_LOCKED_ACCOUNT_GOOGLE_LOGIN_BLOCKED",
            tableName: "nguoi_dung",
            recordId: user.id,
            message: "Khóa tài khoản người dùng khi đăng nhập bằng Google",
          },
          tx
        );
      });

      throw LoiUngDung.biKhoa("Account has been biKhoa");
    }

    if (user.status === "CHO_DOI_MAT_KHAU") {
      throw LoiUngDung.khongCoQuyen("Tài khoản phải đổi mật khẩu trước khi tiếp tục");
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
          action: "AUTH_GOOGLE_LOGIN_SUCCESS",
          tableName: "phien_dang_nhap",
          message: "Người dùng đăng nhập thành công bằng Google",
          metadata: {
            googleSubject: danhTinhGoogle.subject,
            audience: danhTinhGoogle.audience
          }
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

  private async taoHocVienTuDanhTinhGoogle(input: {
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    googleSubject: string;
  }): Promise<NguoiDung> {
    const bamMatKhauSinhRa = await this.deps.boMaHoaMatKhau.bam(
      this.deps.dichVuToken.taoTokenLamMoi()
    );

    return this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      const nguoiDungDaTonTai = await this.deps.khoNguoiDung.timTheoEmail(input.email, tx);

      if (nguoiDungDaTonTai) {
        return nguoiDungDaTonTai;
      }

      const nguoiDungMoi = await this.deps.khoNguoiDung.tao(
        {
          email: input.email,
          passwordHash: bamMatKhauSinhRa,
          fullName: input.fullName ?? input.email.split("@")[0],
          avatarUrl: input.avatarUrl,
          roleCode: this.deps.maCodeVaiTroSinhVienMacDinh,
          status: "HOAT_DONG",
          temporaryPasswordCreatedAt: null
        },
        tx
      );

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: nguoiDungMoi.id,
          level: "INFO",
          action: "AUTH_GOOGLE_ACCOUNT_CREATED",
          tableName: "nguoi_dung",
          recordId: nguoiDungMoi.id,
          message: "Tài khoản sinh viên được tạo từ đăng nhập Google",
          metadata: {
            email: input.email,
            googleSubject: input.googleSubject,
            roleCode: this.deps.maCodeVaiTroSinhVienMacDinh
          }
        },
        tx
      );

      return nguoiDungMoi;
    });
  }
}



