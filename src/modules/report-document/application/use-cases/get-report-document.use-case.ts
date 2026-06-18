import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoBaoCaoTaiLieu } from "../ports/report-document.repository.js";

type PhuThuoc = {
  khoBaoCaoTaiLieu: KhoBaoCaoTaiLieu;
};

export class XuLyLayChiTietBaoCaoTaiLieu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(maBaoCao: string) {
    const baoCao = await this.deps.khoBaoCaoTaiLieu.timTheoMa(maBaoCao);

    if (!baoCao) {
      throw LoiUngDung.khongTimThay("Không tìm thấy báo cáo tài liệu");
    }

    return baoCao;
  }
}
