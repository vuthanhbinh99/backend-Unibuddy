import type { KhoNguoiDung } from "../ports/user.repository.js";
import type { NguoiDungQuanTri } from "../../domain/user.js";

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
};

export class XuLyDanhSachNguoiDung {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(): Promise<NguoiDungQuanTri[]> {
    return this.deps.khoNguoiDung.lietKe();
  }
}