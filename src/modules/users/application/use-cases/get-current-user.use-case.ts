import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { NguoiDungCongKhai } from "../../domain/user.js";
import { anhXaNguoiDungCongKhai } from "../../domain/user.js";
import type { KhoNguoiDung } from "../ports/user.repository.js";

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
};

export class XuLyLayNguoiDungHienTai {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(userId: string): Promise<NguoiDungCongKhai> {
    const user = await this.deps.khoNguoiDung.timTheoMa(userId);

    if (!user) {
      throw LoiUngDung.khongTimThay("Không tìm thấy người dùng");
    }

    if (user.status === "BI_KHOA") {
      throw LoiUngDung.biKhoa("Tài khoản đã bị khóa");
    }

    return anhXaNguoiDungCongKhai(user);
  }
}



