import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { NguoiDungCongKhai } from "../../domain/user.js";
import { anhXaNguoiDungCongKhai } from "../../domain/user.js";
import type { KhoNguoiDung } from "../ports/user.repository.js";

export type LenhCapNhatThongTinNguoiDungHienTai = {
  actorId: string;
  fullName?: string;
  phoneNumber?: string | null;
};

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
};

const chuanHoaChuoi = (value: string | undefined | null) => value?.trim() ?? "";

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

    const fullName = chuanHoaChuoi(command.fullName);
    if (!fullName) {
      throw LoiUngDung.yeuCauSai("Họ tên không được để trống");
    }

    const phoneNumber =
      command.phoneNumber === undefined ? currentUser.phoneNumber : chuanHoaChuoi(command.phoneNumber) || null;

    const updatedUser = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
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
            phoneNumberChanged: phoneNumber !== currentUser.phoneNumber
          }
        },
        tx
      );

      return updated;
    });

    return {
      user: anhXaNguoiDungCongKhai(updatedUser),
      message: "Cập nhật thông tin cá nhân thành công"
    };
  }
}
