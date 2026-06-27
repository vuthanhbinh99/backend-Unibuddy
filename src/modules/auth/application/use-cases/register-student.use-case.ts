import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoNguoiDung } from "../../../users/application/ports/user.repository.js";
import { type NguoiDungCongKhai, anhXaNguoiDungCongKhai } from "../../../users/domain/user.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { BoMaHoaMatKhau } from "../ports/password-hasher.js";
import type { HoSoSinhVienDangKy, KhoDangKySinhVien } from "../ports/student-registration.repository.js";

export type LenhDangKySinhVien = {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  maSinhVien: string;
  maTruong?: number | null;
  maTruongCode?: string | null;
  nganhHoc?: string | null;
  khoaHoc?: string | null;
};

export type KetQuaDangKySinhVien = {
  message: string;
  user: NguoiDungCongKhai;
  studentProfile: HoSoSinhVienDangKy & {
    maTruongCode: string | null;
  };
};

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
  khoDangKySinhVien: KhoDangKySinhVien;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  boMaHoaMatKhau: BoMaHoaMatKhau;
  giaoDich: BoQuanLyGiaoDich;
  maCodeVaiTroSinhVienMacDinh: string;
};

export class XuLyDangKySinhVien {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDangKySinhVien): Promise<KetQuaDangKySinhVien> {
    const email = command.email.trim().toLowerCase();
    const maSinhVien = command.maSinhVien.trim();
    const fullName = command.fullName.trim();
    const maTruongCodeInput = command.maTruongCode?.trim() || null;

    const truongHoc = await this.timTruongHocDangKy(command.maTruong ?? null, maTruongCodeInput);
    const maTruong = truongHoc?.maTruong ?? null;

    const userDaTonTai = await this.deps.khoNguoiDung.timTheoEmail(email);
    if (userDaTonTai) {
      throw LoiUngDung.xungDot("Email này đã được sử dụng");
    }

    const maSinhVienDaTonTai = await this.deps.khoDangKySinhVien.tonTaiMaSinhVien(maSinhVien, maTruong);
    if (maSinhVienDaTonTai) {
      throw LoiUngDung.xungDot("Mã sinh viên này đã được sử dụng");
    }

    const passwordHash = await this.deps.boMaHoaMatKhau.bam(command.password);

    try {
      return await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const user = await this.deps.khoNguoiDung.tao(
          {
            email,
            passwordHash,
            fullName,
            phoneNumber: command.phoneNumber?.trim() || null,
            avatarUrl: command.avatarUrl?.trim() || null,
            roleCode: this.deps.maCodeVaiTroSinhVienMacDinh,
            status: "HOAT_DONG",
            temporaryPasswordCreatedAt: null
          },
          tx
        );

        const studentProfile = await this.deps.khoDangKySinhVien.taoHoSoSinhVien(
          {
            maNguoiDung: user.id,
            maSinhVien,
            maTruong,
            nganhHoc: command.nganhHoc?.trim() || null,
            khoaHoc: command.khoaHoc?.trim() || null
          },
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: user.id,
            level: "INFO",
            action: "AUTH_STUDENT_REGISTERED",
            tableName: "nguoi_dung",
            recordId: user.id,
            message: "Sinh viên đăng ký tài khoản mới",
            metadata: {
              email,
              maSinhVien,
              maTruong,
              maTruongCode: truongHoc?.maTruongCode ?? null,
              roleCode: this.deps.maCodeVaiTroSinhVienMacDinh
            }
          },
          tx
        );

        return {
          message: "Đăng ký tài khoản sinh viên thành công",
          user: anhXaNguoiDungCongKhai(user),
          studentProfile: {
            ...studentProfile,
            maTruongCode: truongHoc?.maTruongCode ?? null
          }
        };
      });
    } catch (error) {
      if (this.laLoiTrungDuLieu(error, "nguoi_dung_email_key")) {
        throw LoiUngDung.xungDot("Email này đã được sử dụng");
      }

      if (this.laLoiTrungDuLieu(error, "uq_ho_so_sinh_vien_truong_msv")) {
        throw LoiUngDung.xungDot("Mã sinh viên này đã được sử dụng");
      }

      throw error;
    }
  }

  private async timTruongHocDangKy(maTruong: number | null, maTruongCode: string | null) {
    const truongTheoMa = maTruong ? await this.deps.khoDangKySinhVien.timTruongTheoMa(maTruong) : null;

    if (maTruong && !truongTheoMa) {
      throw LoiUngDung.khongTimThay("Không tìm thấy trường học");
    }

    const truongTheoCode = maTruongCode
      ? await this.deps.khoDangKySinhVien.timTruongTheoCode(maTruongCode)
      : null;

    if (maTruongCode && !truongTheoCode) {
      throw LoiUngDung.khongTimThay("Không tìm thấy mã trường học");
    }

    if (truongTheoMa && truongTheoCode && truongTheoMa.maTruong !== truongTheoCode.maTruong) {
      throw LoiUngDung.yeuCauSai("Mã trường và Mã code trường không cùng một trường học");
    }

    return truongTheoCode ?? truongTheoMa;
  }

  private laLoiTrungDuLieu(error: unknown, constraintName: string) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505" &&
      "constraint" in error &&
      (error as { constraint?: unknown }).constraint === constraintName
    );
  }
}
