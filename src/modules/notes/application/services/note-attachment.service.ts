import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { TepDinhKemGhiChu } from "../../domain/notes.js";
import type { DuLieuTaoTepDinhKemGhiChu, KhoGhiChu } from "../ports/note.repository.js";
import type { LenhTaoTepDinhKemGhiChu } from "../use-cases/note-use-case.types.js";

type PhuThuoc = {
  khoGhiChu: KhoGhiChu;
  khoNhatKyHeThong: KhoNhatKyHeThong;
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

  async kiemTraTrungDuongDan(dsTep: LenhTaoTepDinhKemGhiChu[], actorId: string, maGhiChu?: string) {
    for (const tep of dsTep) {
      const tepTonTai = await this.deps.khoGhiChu.kiemTraDuongDanTaiLieuDaTonTai(tep.downloadUrl);

      if (tepTonTai) {
        await this.deps.khoNhatKyHeThong.tao({
          actorId,
          level: "WARNING",
          action: "NOTE_ATTACHMENT_DUPLICATE",
          tableName: "tai_lieu",
          recordId: maGhiChu,
          message: "Sinh vien dinh kem tai lieu ghi chu that bai vi file da ton tai trong he thong",
          metadata: {
            maGhiChu: maGhiChu ?? null,
            tenFile: tep.tenFile,
            loaiFile: tep.loaiFile,
            dungLuong: tep.dungLuong,
            coDownloadUrl: true
          }
        });
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
