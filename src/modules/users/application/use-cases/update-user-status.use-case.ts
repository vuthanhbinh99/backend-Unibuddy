import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { taoMatKhauTamSecure } from "../../../../shared/security/secure-password.js";
import type { BoMaHoaMatKhau } from "../../../auth/application/ports/password-hasher.js";
import type { KhoPhienDangNhap } from "../../../auth/application/ports/session.repository.js";
import type { KhoNguoiDung } from "../ports/user.repository.js";
import { anhXaNguoiDungQuanTri, type NguoiDungQuanTri } from "../../domain/user.js";

const THOI_HAN_MAT_KHAU_TAM_MS = 24 * 60 * 60 * 1000;

export type LenhCapNhatTrangThaiNguoiDung = {
  actorId: string | null;
  userId: string;
  status: "HOAT_DONG" | "BI_KHOA" | "CHO_DOI_MAT_KHAU";
};

export type KetQuaCapNhatTrangThaiNguoiDung = {
  user: NguoiDungQuanTri;
  temporaryPassword?: string;
  temporaryPasswordExpiresAt?: Date;
};

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
  khoPhienDangNhap: KhoPhienDangNhap;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  boMaHoaMatKhau: BoMaHoaMatKhau;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyCapNhatTrangThaiNguoiDung {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatTrangThaiNguoiDung): Promise<KetQuaCapNhatTrangThaiNguoiDung> {
    const user = await this.deps.khoNguoiDung.timTheoMa(command.userId);

    if (!user) {
      throw LoiUngDung.khongTimThay("Không tìm thấy người dùng");
    }

    if (command.status === "CHO_DOI_MAT_KHAU") {
      const tempPassword = taoMatKhauTamSecure(12, 16);
      const tempPasswordIssuedAt = new Date();
      const tempPasswordExpiresAt = new Date(tempPasswordIssuedAt.getTime() + THOI_HAN_MAT_KHAU_TAM_MS);
      const passwordHash = await this.deps.boMaHoaMatKhau.bam(tempPassword);

      const userUpdated = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        await this.deps.khoPhienDangNhap.thuHoiPhienHoatDongTheoMaNguoiDung(command.userId, tx);

        const capNhat = await this.deps.khoNguoiDung.capNhatMatKhau(
          {
            userId: command.userId,
            passwordHash,
            status: "CHO_DOI_MAT_KHAU",
            temporaryPasswordCreatedAt: tempPasswordIssuedAt
          },
          tx
        );

        if (!capNhat) {
          throw LoiUngDung.khongTimThay("Không tìm thấy người dùng");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "AUTH_TEMP_PASSWORD_REISSUED",
            tableName: "nguoi_dung",
            recordId: command.userId,
            message: "Quản trị viên cấp lại mật khẩu tạm cho tài khoản",
            metadata: {
              userId: command.userId
            }
          },
          tx
        );

        return capNhat;
      });

      return {
        user: anhXaNguoiDungQuanTri(userUpdated),
        temporaryPassword: tempPassword,
        temporaryPasswordExpiresAt: tempPasswordExpiresAt
      };
    }

    const userUpdated = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      await this.deps.khoPhienDangNhap.thuHoiPhienHoatDongTheoMaNguoiDung(command.userId, tx);

      const capNhat = await this.deps.khoNguoiDung.capNhatTrangThai(
        {
          userId: command.userId,
          status: command.status,
          temporaryPasswordCreatedAt: null
        },
        tx
      );

      if (!capNhat) {
        throw LoiUngDung.khongTimThay("Không tìm thấy người dùng");
      }

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId,
          level: "INFO",
          action: command.status === "BI_KHOA" ? "USER_ACCOUNT_LOCKED" : "USER_ACCOUNT_UNLOCKED",
          tableName: "nguoi_dung",
          recordId: command.userId,
          message: command.status === "BI_KHOA" ? "Quản trị viên đã khóa tài khoản" : "Quản trị viên đã mở khóa tài khoản",
          metadata: {
            userId: command.userId,
            status: command.status,
            oldStatus: user.status
          }
        },
        tx
      );

      return capNhat;
    });

    return {
      user: anhXaNguoiDungQuanTri(userUpdated)
    };
  }
}