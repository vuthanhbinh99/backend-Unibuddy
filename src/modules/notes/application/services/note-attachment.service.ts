import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { TepDinhKemGhiChu } from "../../domain/notes.js";
import type { DuLieuTaoTepDinhKemGhiChu, KhoGhiChu } from "../ports/note.repository.js";
import type { LenhTaoTepDinhKemGhiChu } from "../use-cases/note-use-case.types.js";

type PhuThuoc = {
  khoGhiChu: KhoGhiChu;
};

const chuyenTepDinhKem = (
  command: LenhTaoTepDinhKemGhiChu,
  maGhiChu: string,
  actorId: string
): DuLieuTaoTepDinhKemGhiChu => ({
  maGhiChu,
  nguoiTaiLen: actorId,
  duongDanLuuTru: command.downloadUrl,
  tenFile: command.tenFile,
  loaiFile: command.loaiFile,
  dungLuong: command.dungLuong
});

export class DichVuTepDinhKemGhiChu {
  constructor(private readonly deps: PhuThuoc) {}

  async kiemTraTrungDuongDan(dsTep: LenhTaoTepDinhKemGhiChu[]) {
    for (const tep of dsTep) {
      const tepTonTai = await this.deps.khoGhiChu.kiemTraDuongDanTaiLieuDaTonTai(tep.downloadUrl);

      if (tepTonTai) {
        throw LoiUngDung.xungDot("Tệp đính kèm này đã tồn tại trong hệ thống");
      }
    }
  }

  async taoTepDinhKem(
    tep: LenhTaoTepDinhKemGhiChu,
    maGhiChu: string,
    actorId: string,
    tx?: BoThucThiTruyVan
  ) {
    return this.deps.khoGhiChu.taoTepDinhKem(chuyenTepDinhKem(tep, maGhiChu, actorId), tx);
  }

  async luuDanhSachTepDinhKem(
    dsTep: LenhTaoTepDinhKemGhiChu[],
    maGhiChu: string,
    actorId: string,
    tx?: BoThucThiTruyVan
  ): Promise<TepDinhKemGhiChu[]> {
    const ketQua: TepDinhKemGhiChu[] = [];

    for (const tep of dsTep) {
      ketQua.push(await this.taoTepDinhKem(tep, maGhiChu, actorId, tx));
    }

    return ketQua;
  }
}
