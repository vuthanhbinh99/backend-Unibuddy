import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoLichThi } from "../ports/exam.repository.js";

export type LenhXoaLichThi = {
  actorId: string;
  maLichThi: string;
};

type PhuThuoc = {
  khoLichThi: KhoLichThi;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyXoaLichThi {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXoaLichThi) {
    const lichThi = await this.deps.khoLichThi.timTheoMaCuaSinhVien(command.maLichThi, command.actorId);

    if (!lichThi) {
      throw LoiUngDung.khongTimThay("Không tìm thấy lịch thi");
    }

    try {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        await this.deps.khoLichThi.xoaNhacNhoTheoLichThi(command.maLichThi, tx);
        const daXoa = await this.deps.khoLichThi.xoa(command.maLichThi, tx);

        if (!daXoa) {
          throw LoiUngDung.khongTimThay("Không tìm thấy lịch thi");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "EXAM_DELETED",
            tableName: "lich_thi",
            recordId: command.maLichThi,
            message: "Sinh viên xóa lịch thi",
            metadata: {
              maLichThi: command.maLichThi,
              maMonHoc: lichThi.maMonHoc
            }
          },
          tx
        );
      });

      return {
        message: "Đã xóa lịch thi thành công",
        maLichThi: command.maLichThi
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể xóa lịch thi lúc này");
    }
  }
}
