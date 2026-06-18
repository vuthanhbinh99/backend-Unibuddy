import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoTruongHoc } from "../ports/school.repository.js";

export type LenhTaoTruongHoc = {
  actorId: string | null;
  maTruongCode: string;
  tenTruong: string;
};

type PhuThuoc = {
  khoTruongHoc: KhoTruongHoc;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyTaoTruongHoc {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoTruongHoc) {
    const truongHocDaTonTai = await this.deps.khoTruongHoc.timTheoMa(command.maTruongCode);

    if (truongHocDaTonTai) {
      throw LoiUngDung.xungDot("Mã trường học đã tồn tại");
    }

    return this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      const truongHoc = await this.deps.khoTruongHoc.tao(
        {
          maTruongCode: command.maTruongCode,
          tenTruong: command.tenTruong
        },
        tx
      );

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId,
          level: "INFO",
          action: "SCHOOL_CREATED",
          tableName: "truong_hoc",
          recordId: truongHoc.maTruongCode,
          message: "Admin tạo trường học mới",
          metadata: {
            maTruongCode: truongHoc.maTruongCode,
            tenTruong: truongHoc.tenTruong
          }
        },
        tx
      );

      return truongHoc;
    });
  }
}
