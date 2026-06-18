import type { KhoTruongHoc } from "../ports/school.repository.js";

type PhuThuoc = {
  khoTruongHoc: KhoTruongHoc;
};

export class XuLyDanhSachTruongHoc {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi() {
    return this.deps.khoTruongHoc.lietKe();
  }
}
