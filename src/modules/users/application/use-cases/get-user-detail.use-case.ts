import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoNguoiDung } from "../ports/user.repository.js";
import type { NguoiDungQuanTri } from "../../domain/user.js";
import { anhXaNguoiDungQuanTri } from "../../domain/user.js";

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
};

export class XuLyLayChiTietNguoiDung {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(userId: string): Promise<NguoiDungQuanTri> {
    const user = await this.deps.khoNguoiDung.timTheoMa(userId);

    if (!user) {
      throw LoiUngDung.khongTimThay("Không tìm thấy người dùng");
    }

    return anhXaNguoiDungQuanTri(user);
  }
}