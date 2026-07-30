import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type {
  HoSoSinhVienDangKy,
  KhoDangKySinhVien
} from "../../../auth/application/ports/student-registration.repository.js";
import type { NguoiDungCongKhai } from "../../domain/user.js";
import { anhXaNguoiDungCongKhai } from "../../domain/user.js";
import type { KhoNguoiDung } from "../ports/user.repository.js";

export type LenhCapNhatThongTinNguoiDungHienTai = {
  actorId: string;
  fullName?: string;
  phoneNumber?: string | null;
  maSinhVien?: string;
};

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
  khoDangKySinhVien: KhoDangKySinhVien;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  maCodeVaiTroSinhVienMacDinh: string;
};

const chuanHoaChuoi = (value: string | undefined | null) => value?.trim() ?? "";
const anhXaHoSoSinhVienCongKhai = (hoSo: HoSoSinhVienDangKy | null) =>
  hoSo ? { ...hoSo, maTruongCode: hoSo.maTruongCode ?? null } : null;

export class XuLyCapNhatThongTinNguoiDungHienTai {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatThongTinNguoiDungHienTai): Promise<{ user: NguoiDungCongKhai; message: string }> {
    const currentUser = await this.deps.khoNguoiDung.timTheoMa(command.actorId);

    if (!currentUser) {
      throw LoiUngDung.khongTimThay("Không tìm thấy người dùng");
    }

    if (currentUser.status === "BI_KHOA") {
      throw LoiUngDung.biKhoa("Tài khoản đã bị khóa");
    }

    const fullName = command.fullName === undefined ? currentUser.fullName : chuanHoaChuoi(command.fullName);
    if (!fullName) {
      throw LoiUngDung.yeuCauSai("Họ tên không được để trống");
    }

    const phoneNumber =
      command.phoneNumber === undefined ? currentUser.phoneNumber : chuanHoaChuoi(command.phoneNumber) || null;
    const maSinhVien = command.maSinhVien === undefined ? undefined : chuanHoaChuoi(command.maSinhVien);
    if (command.maSinhVien !== undefined && !maSinhVien) {
      throw LoiUngDung.yeuCauSai("Mã sinh viên không được để trống");
    }

    const hoSoHienTai =
      currentUser.role.code === this.deps.maCodeVaiTroSinhVienMacDinh
        ? await this.deps.khoDangKySinhVien.timHoSoSinhVienTheoNguoiDung(command.actorId)
        : null;

    if (maSinhVien !== undefined && currentUser.role.code !== this.deps.maCodeVaiTroSinhVienMacDinh) {
      throw LoiUngDung.khongCoQuyen("Chỉ tài khoản sinh viên mới được cập nhật mã sinh viên");
    }

    if (maSinhVien !== undefined) {
      const maSinhVienDaTonTai = await this.deps.khoDangKySinhVien.tonTaiMaSinhVien(
        maSinhVien,
        hoSoHienTai?.maTruong ?? null,
        command.actorId
      );
      if (maSinhVienDaTonTai) {
        throw LoiUngDung.xungDot("Mã sinh viên này đã được sử dụng");
      }
    }

    const ketQua = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      const updated = await this.deps.khoNguoiDung.capNhatThongTin(
        {
          userId: command.actorId,
          fullName,
          phoneNumber
        },
        tx
      );

      if (!updated) {
        throw LoiUngDung.khongTimThay("Không tìm thấy người dùng");
      }

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId,
          level: "INFO",
          action: "USER_PROFILE_UPDATED",
          tableName: "nguoi_dung",
          recordId: command.actorId,
          message: "Người dùng cập nhật thông tin cá nhân",
          metadata: {
            fullNameChanged: fullName !== currentUser.fullName,
            phoneNumberChanged: phoneNumber !== currentUser.phoneNumber,
            maSinhVienChanged: maSinhVien !== undefined && maSinhVien !== hoSoHienTai?.maSinhVien
          }
        },
        tx
        );

      let studentProfile: HoSoSinhVienDangKy | null = hoSoHienTai;
      if (maSinhVien !== undefined) {
        studentProfile = hoSoHienTai
          ? await this.deps.khoDangKySinhVien.capNhatMaSinhVien(command.actorId, maSinhVien, tx)
          : await this.deps.khoDangKySinhVien.taoHoSoSinhVien(
              {
                maNguoiDung: command.actorId,
                maSinhVien,
                maTruong: null,
                nganhHoc: null,
                khoaHoc: null
              },
              tx
            );
      }

      return { updated, studentProfile };
    });

    return {
      user: {
        ...anhXaNguoiDungCongKhai(ketQua.updated),
        studentProfile: anhXaHoSoSinhVienCongKhai(ketQua.studentProfile)
      },
      message: "Cập nhật thông tin cá nhân thành công"
    };
  }
}
