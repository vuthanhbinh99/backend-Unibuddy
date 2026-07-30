import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoHocPhan } from "../ports/course.repository.js";
import type { DichVuGhiLogLoiHocPhan } from "../services/course-error-logger.service.js";

export type LenhXoaHocKy = {
  actorId: string;
  maHocKy: string;
  force?: boolean;
};

type PhuThuoc = {
  khoHocPhan: KhoHocPhan;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiHocPhan: DichVuGhiLogLoiHocPhan;
};

export class XuLyXoaHocKy {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXoaHocKy) {
    const hocKy = await this.deps.khoHocPhan.timHocKyCuaSinhVien(command.maHocKy, command.actorId);

    if (!hocKy) {
      await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
        actorId: command.actorId,
        action: "SEMESTER_DELETE_NOT_FOUND",
        tableName: "hoc_ky",
        recordId: command.maHocKy,
        message: "Sinh viên xóa học kỳ thất bại vì học kỳ không tồn tại hoặc không thuộc sinh viên",
        metadata: {
          maHocKy: command.maHocKy,
          force: Boolean(command.force)
        }
      });
      throw LoiUngDung.khongTimThay("Không tìm thấy học kỳ để xóa");
    }

    const lienKet = await this.deps.khoHocPhan.demLienKetHocKy(command.maHocKy);

    if (lienKet.tongLienKet > 0 && !command.force) {
      await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
        actorId: command.actorId,
        action: "SEMESTER_DELETE_REQUIRES_FORCE",
        tableName: "hoc_ky",
        recordId: command.maHocKy,
        message: "Sinh viên xóa học kỳ bị cảnh báo vì học kỳ có dữ liệu liên quan",
        metadata: {
          maHocKy: command.maHocKy,
          tenHocKy: hocKy.tenHocKy,
          relatedCounts: lienKet
        }
      });
      throw LoiUngDung.xungDot("Học kỳ có dữ liệu đi kèm", {
        canForceDelete: true,
        relatedCounts: lienKet,
        messageForUser:
          "Học kỳ này đang có môn học và dữ liệu điểm số/bài tập/lịch học đi kèm. Nếu xóa, toàn bộ môn học và dữ liệu liên quan sẽ bị xóa theo. Bạn vẫn muốn tiếp tục?"
      });
    }

    try {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const daXoa = await this.deps.khoHocPhan.xoaHocKy(command.maHocKy, tx);

        if (!daXoa) {
          await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
            actorId: command.actorId,
            action: "SEMESTER_DELETE_NOT_FOUND_DURING_TRANSACTION",
            tableName: "hoc_ky",
            recordId: command.maHocKy,
            message: "Sinh viên xóa học kỳ thất bại vì bản ghi không còn tồn tại trong giao dịch",
            metadata: {
              maHocKy: command.maHocKy,
              force: Boolean(command.force)
            }
          });
          throw LoiUngDung.khongTimThay("Không tìm thấy học kỳ để xóa");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "SEMESTER_DELETED",
            tableName: "hoc_ky",
            recordId: command.maHocKy,
            message: "Sinh viên xóa học kỳ thành công",
            metadata: {
              maHocKy: command.maHocKy,
              tenHocKy: hocKy.tenHocKy,
              force: Boolean(command.force),
              relatedCounts: lienKet
            }
          },
          tx
        );
      });

      return {
        message: "Xóa học kỳ thành công",
        maHocKy: command.maHocKy
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiHocPhan.ghi({
        actorId: command.actorId,
        action: "SEMESTER_DELETE_FAILED",
        tableName: "hoc_ky",
        recordId: command.maHocKy,
        message: "Lỗi xóa học kỳ trong Cơ sở dữ liệu",
        error,
        metadata: {
          maHocKy: command.maHocKy,
          tenHocKy: hocKy.tenHocKy,
          force: Boolean(command.force)
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể xóa học kỳ lúc này");
    }
  }
}
