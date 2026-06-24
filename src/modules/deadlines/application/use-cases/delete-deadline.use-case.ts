import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoDeadline } from "../ports/deadline.repository.js";
import type { DichVuGhiLogLoiDeadline } from "../services/deadline-error-logger.service.js";

export type LenhXoaDeadline = {
  actorId: string;
  maDeadline: string;
};

type PhuThuoc = {
  khoDeadline: KhoDeadline;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiDeadline: DichVuGhiLogLoiDeadline;
};

export class XuLyXoaDeadline {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXoaDeadline) {
    const deadline = await this.deps.khoDeadline.timTheoMaCuaSinhVien(command.maDeadline, command.actorId);

    if (!deadline) {
      await this.deps.dichVuGhiLogLoiDeadline.ghiCanhBao({
        actorId: command.actorId,
        action: "DEADLINE_DELETE_NOT_FOUND",
        tableName: "deadline",
        recordId: command.maDeadline,
        message: "Sinh viên xóa deadline thất bại vì không tìm thấy bản ghi",
        metadata: {
          maDeadline: command.maDeadline
        }
      });
      throw LoiUngDung.khongTimThay("Không tìm thấy deadline cần xóa");
    }

    try {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const soNhacNhoDaXoa = await this.deps.khoDeadline.xoaNhacNhoTheoDeadline(command.maDeadline, tx);
        const daXoa = await this.deps.khoDeadline.xoa(command.maDeadline, tx);

        if (!daXoa) {
          await this.deps.dichVuGhiLogLoiDeadline.ghiCanhBao({
            actorId: command.actorId,
            action: "DEADLINE_DELETE_NOT_FOUND_DURING_TRANSACTION",
            tableName: "deadline",
            recordId: command.maDeadline,
            message: "Sinh viên xóa deadline thất bại vì bản ghi không còn tồn tại trong transaction",
            metadata: {
              maDeadline: command.maDeadline,
              soNhacNhoDaXoa
            }
          });
          throw LoiUngDung.khongTimThay("Không tìm thấy deadline cần xóa");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "DEADLINE_DELETED",
            tableName: "deadline",
            recordId: command.maDeadline,
            message: "Sinh viên xóa deadline thành công",
            metadata: {
              maDeadline: command.maDeadline,
              maMonHoc: deadline.maMonHoc,
              tieuDe: deadline.tieuDe,
              hanNop: deadline.hanNop.toISOString(),
              soNhacNhoDaXoa
            }
          },
          tx
        );
      });

      return {
        message: "Đã xóa deadline thành công!",
        maDeadline: command.maDeadline
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiDeadline.ghi({
        actorId: command.actorId,
        action: "DEADLINE_DELETE_FAILED",
        tableName: "deadline",
        recordId: command.maDeadline,
        message: "Lỗi hệ thống khi thực hiện xóa deadline",
        error,
        metadata: {
          maDeadline: command.maDeadline,
          maMonHoc: deadline.maMonHoc,
          tieuDe: deadline.tieuDe
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Xóa thất bại, vui lòng thử lại sau!");
    }
  }
}
