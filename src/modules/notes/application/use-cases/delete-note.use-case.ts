import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DichVuQuyenGhiChu } from "../services/note-access.service.js";
import type { DichVuGhiLogLoiGhiChu } from "../services/note-error-logger.service.js";
import type { KhoGhiChu } from "../ports/note.repository.js";
import type { LenhXoaGhiChu } from "./note-use-case.types.js";

type PhuThuoc = {
  khoGhiChu: KhoGhiChu;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuQuyenGhiChu: DichVuQuyenGhiChu;
  dichVuGhiLogLoiGhiChu: DichVuGhiLogLoiGhiChu;
};

export class XuLyXoaGhiChu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXoaGhiChu) {
    const ghiChu = await this.deps.dichVuQuyenGhiChu.layGhiChuThuocSinhVien(
      command.actorId,
      command.maGhiChu,
      "xóa"
    );

    try {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const soTepDaXoa = await this.deps.khoGhiChu.danhDauXoaTepDinhKemTheoMaGhiChu(
          command.maGhiChu,
          command.actorId,
          tx
        );

        const daXoa = await this.deps.khoGhiChu.xoaTheoMa(command.maGhiChu, tx);

        if (!daXoa) {
          await this.deps.dichVuGhiLogLoiGhiChu.ghiCanhBao({
            actorId: command.actorId,
            action: "NOTE_DELETE_NOT_FOUND_DURING_TRANSACTION",
            tableName: "ghi_chu",
            recordId: command.maGhiChu,
            message: "Sinh vien xoa ghi chu that bai vi ban ghi khong con ton tai trong transaction",
            metadata: {
              maGhiChu: command.maGhiChu
            }
          });
          throw LoiUngDung.khongTimThay("Không tìm thấy ghi chú");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "NOTE_DELETED",
            tableName: "ghi_chu",
            recordId: command.maGhiChu,
            message: "Sinh viên xóa ghi chú thành công",
            metadata: {
              maGhiChu: command.maGhiChu,
              maMonHoc: ghiChu.maMonHoc,
              soTepDaXoa
            }
          },
          tx
        );
      });

      return {
        message: "Xóa ghi chú thành công",
        maGhiChu: command.maGhiChu
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiGhiChu.ghi({
        actorId: command.actorId,
        action: "NOTE_DELETE_FAILED",
        tableName: "ghi_chu",
        recordId: command.maGhiChu,
        message: "Lỗi xóa ghi chú trong database",
        error,
        metadata: {
          maGhiChu: command.maGhiChu,
          maMonHoc: ghiChu.maMonHoc
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể xóa ghi chú lúc này");
    }
  }
}
