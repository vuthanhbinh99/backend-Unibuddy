import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoTruongHoc } from "../ports/school.repository.js";

export type LenhXoaTruongHoc = {
  actorId: string | null;
  maTruongCode: string;
};

export type KetQuaXoaTruongHoc = {
  deleted: true;
  maTruongCode: string;
};

type PhuThuoc = {
  khoTruongHoc: KhoTruongHoc;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyXoaTruongHoc {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXoaTruongHoc): Promise<KetQuaXoaTruongHoc> {
    const truongHoc = await this.deps.khoTruongHoc.timTheoMa(command.maTruongCode);

    if (!truongHoc) {
      throw LoiUngDung.khongTimThay("Không tìm thấy trường học");
    }

    const soLuongSinhVien = await this.deps.khoTruongHoc.demSoHoSoSinhVienTheoMaTruongCode(
      command.maTruongCode
    );

    if (soLuongSinhVien > 0) {
      throw LoiUngDung.xungDot("Không thể xóa trường học đang có hồ sơ sinh viên liên kết");
    }

    await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      await this.deps.khoTruongHoc.xoaDuLieuLienQuanTheoMaTruongCode(command.maTruongCode, tx);

      const daXoa = await this.deps.khoTruongHoc.xoaTheoMa(command.maTruongCode, tx);

      if (!daXoa) {
        throw LoiUngDung.khongTimThay("Không tìm thấy trường học");
      }

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId,
          level: "INFO",
          action: "SCHOOL_DELETED",
          tableName: "truong_hoc",
          recordId: command.maTruongCode,
          message: "Admin xóa trường học",
          metadata: {
            maTruongCode: command.maTruongCode
          }
        },
        tx
      );
    });

    return {
      deleted: true,
      maTruongCode: truongHoc.maTruongCode
    };
  }
}
