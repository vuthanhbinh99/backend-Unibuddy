import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoTruongHoc } from "../ports/school.repository.js";

export type LenhCapNhatTruongHoc = {
  actorId: string | null;
  maTruongCode: string;
  tenTruong: string;
};

type PhuThuoc = {
  khoTruongHoc: KhoTruongHoc;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyCapNhatTruongHoc {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatTruongHoc) {
    const truongHocDaTonTai = await this.deps.khoTruongHoc.timTheoMa(command.maTruongCode);

    if (!truongHocDaTonTai) {
      throw LoiUngDung.khongTimThay("Không tìm thấy trường học");
    }

    return this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      const truongHoc = await this.deps.khoTruongHoc.capNhat(
        {
          maTruongCode: command.maTruongCode,
          tenTruong: command.tenTruong
        },
        tx
      );

      if (!truongHoc) {
        throw LoiUngDung.khongTimThay("Không tìm thấy trường học");
      }

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId,
          level: "INFO",
          action: "SCHOOL_UPDATED",
          tableName: "truong_hoc",
          recordId: truongHoc.maTruongCode,
          message: "Admin cập nhật trường học",
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
