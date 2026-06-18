import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoTruongHoc } from "../../../schools/application/ports/school.repository.js";
import type { KhoHocThuatTruongHoc } from "../ports/academic-rules.repository.js";

type PhuThuoc = {
  khoTruongHoc: KhoTruongHoc;
  khoHocThuatTruongHoc: KhoHocThuatTruongHoc;
};

export class XuLyLayCauHinhHocThuatTruongHoc {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(maTruongCode: string) {
    const truongHoc = await this.deps.khoTruongHoc.timTheoMa(maTruongCode);

    if (!truongHoc) {
      throw LoiUngDung.khongTimThay("Không tìm thấy trường học");
    }

    return this.deps.khoHocThuatTruongHoc.layCauHinh(maTruongCode);
  }
}
