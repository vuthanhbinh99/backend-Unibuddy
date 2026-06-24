import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DichVuGhiLogLoiThoiKhoaBieu } from "../services/schedule-error-logger.service.js";
import type { KhoLichHoc } from "../ports/schedule.repository.js";

export type LenhXoaLichHoc = {
  actorId: string;
  maLichHoc: string;
};

type PhuThuoc = {
  khoLichHoc: KhoLichHoc;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiThoiKhoaBieu: DichVuGhiLogLoiThoiKhoaBieu;
};

export class XuLyXoaLichHoc {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXoaLichHoc) {
    const lichHoc = await this.deps.khoLichHoc.timTheoMaCuaSinhVien(command.maLichHoc, command.actorId);

    if (!lichHoc) {
      await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghiCanhBao({
        actorId: command.actorId,
        action: "SCHEDULE_DELETE_NOT_FOUND",
        tableName: "lich_hoc",
        recordId: command.maLichHoc,
        message: "Sinh vien xoa lich hoc that bai vi khong tim thay lich hoc",
        metadata: {
          maLichHoc: command.maLichHoc
        }
      });
      throw LoiUngDung.khongTimThay("Không tìm thấy lịch học");
    }

    try {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const daXoa = await this.deps.khoLichHoc.xoa(command.maLichHoc, tx);

        if (!daXoa) {
          await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghiCanhBao({
            actorId: command.actorId,
            action: "SCHEDULE_DELETE_NOT_FOUND_DURING_TRANSACTION",
            tableName: "lich_hoc",
            recordId: command.maLichHoc,
            message: "Sinh vien xoa lich hoc that bai vi ban ghi khong con ton tai trong transaction",
            metadata: {
              maLichHoc: command.maLichHoc
            }
          });
          throw LoiUngDung.khongTimThay("Không tìm thấy lịch học");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "SCHEDULE_DELETED",
            tableName: "lich_hoc",
            recordId: command.maLichHoc,
            message: "Sinh viên đã xóa lịch học khỏi TKB",
            metadata: {
              maLichHoc: command.maLichHoc,
              maMonHoc: lichHoc.maMonHoc,
              thu: lichHoc.thu,
              tietBatDau: lichHoc.tietBatDau,
              soTiet: lichHoc.soTiet
            }
          },
          tx
        );
      });

      return {
        message: "Đã xóa lịch học thành công",
        maLichHoc: command.maLichHoc
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghi({
        actorId: command.actorId,
        action: "SCHEDULE_DELETE_FAILED",
        tableName: "lich_hoc",
        recordId: command.maLichHoc,
        message: "Lỗi xóa lịch học khỏi database",
        error,
        metadata: {
          maLichHoc: command.maLichHoc
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể xóa lịch học lúc này");
    }
  }
}
