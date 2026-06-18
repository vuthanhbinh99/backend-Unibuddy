import type { TrangThaiBaoCaoTaiLieu } from "../../domain/report-document.js";
import type { KhoBaoCaoTaiLieu } from "../ports/report-document.repository.js";

type PhuThuoc = {
  khoBaoCaoTaiLieu: KhoBaoCaoTaiLieu;
};

export class XuLyDanhSachBaoCaoTaiLieu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(trangThai?: TrangThaiBaoCaoTaiLieu) {
    return this.deps.khoBaoCaoTaiLieu.lietKe(trangThai);
  }
}
