import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoTruongHoc } from "../ports/school.repository.js";

type PhuThuoc = {
  khoTruongHoc: KhoTruongHoc;
};

export class XuLyLayChiTietTruongHoc {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(maTruongCode: string) {
    const truongHoc = await this.deps.khoTruongHoc.timTheoMa(maTruongCode);
    const timTheoTen = await this.deps.khoTruongHoc.timTheoTen(maTruongCode);
    if (!timTheoTen || timTheoTen.length === 0) {
      throw LoiUngDung.khongTimThay("Không tìm thấy trường học");
    }

    if (!truongHoc) {
      throw LoiUngDung.khongTimThay("Không tìm thấy trường học");
    }

    return truongHoc;
  }
}
