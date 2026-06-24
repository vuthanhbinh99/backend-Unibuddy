import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoHocPhan } from "../ports/course.repository.js";
import type { DichVuGhiLogLoiHocPhan } from "../services/course-error-logger.service.js";

export type LenhXoaHocPhan = {
  actorId: string;
  maMonHoc: string;
  force?: boolean;
};

type PhuThuoc = {
  khoHocPhan: KhoHocPhan;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiHocPhan: DichVuGhiLogLoiHocPhan;
};

export class XuLyXoaHocPhan {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXoaHocPhan) {
    const monHoc = await this.deps.khoHocPhan.timTheoMaCuaSinhVien(command.maMonHoc, command.actorId);

    if (!monHoc) {
      await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
        actorId: command.actorId,
        action: "COURSE_DELETE_NOT_FOUND",
        tableName: "mon_hoc",
        recordId: command.maMonHoc,
        message: "Sinh viên xóa môn học thất bại vì môn học không tồn tại hoặc không thuộc sinh viên",
        metadata: {
          maMonHoc: command.maMonHoc,
          force: Boolean(command.force)
        }
      });
      throw LoiUngDung.khongTimThay("Không tìm thấy môn học để xóa");
    }

    const lienKet = await this.deps.khoHocPhan.demLienKet(command.maMonHoc);

    if (lienKet.tongLienKet > 0 && !command.force) {
      await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
        actorId: command.actorId,
        action: "COURSE_DELETE_REQUIRES_FORCE",
        tableName: "mon_hoc",
        recordId: command.maMonHoc,
        message: "Sinh viên xóa môn học bị cảnh báo vì môn học có dữ liệu liên quan",
        metadata: {
          maMonHoc: command.maMonHoc,
          maHocKy: monHoc.maHocKy,
          maMon: monHoc.maMon,
          tenMon: monHoc.tenMon,
          relatedCounts: lienKet
        }
      });
      throw LoiUngDung.xungDot("Môn học có dữ liệu đi kèm", {
        canForceDelete: true,
        relatedCounts: lienKet,
        messageForUser:
          "Môn học này đang có dữ liệu điểm số/bài tập/lịch học đi kèm. Nếu xóa, toàn bộ dữ liệu liên quan có thể bị mất hoặc bỏ liên kết. Bạn vẫn muốn tiếp tục?"
      });
    }

    try {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const daXoa = await this.deps.khoHocPhan.xoa(command.maMonHoc, tx);

        if (!daXoa) {
          await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
            actorId: command.actorId,
            action: "COURSE_DELETE_NOT_FOUND_DURING_TRANSACTION",
            tableName: "mon_hoc",
            recordId: command.maMonHoc,
            message: "Sinh viên xóa môn học thất bại vì bản ghi không còn tồn tại trong giao dịch",
            metadata: {
              maMonHoc: command.maMonHoc,
              force: Boolean(command.force)
            }
          });
          throw LoiUngDung.khongTimThay("Không tìm thấy môn học để xóa");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "COURSE_DELETED",
            tableName: "mon_hoc",
            recordId: command.maMonHoc,
            message: "Sinh viên xóa môn học thành công",
            metadata: {
              maMonHoc: command.maMonHoc,
              maHocKy: monHoc.maHocKy,
              maMon: monHoc.maMon,
              tenMon: monHoc.tenMon,
              force: Boolean(command.force),
              relatedCounts: lienKet
            }
          },
          tx
        );
      });

      return {
        message: "Xóa môn học thành công",
        maMonHoc: command.maMonHoc
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiHocPhan.ghi({
        actorId: command.actorId,
        action: "COURSE_DELETE_FAILED",
        tableName: "mon_hoc",
        recordId: command.maMonHoc,
        message: "Lỗi xóa môn học trong Cơ sở dữ liệu",
        error,
        metadata: {
          maMonHoc: command.maMonHoc,
          maHocKy: monHoc.maHocKy,
          maMon: monHoc.maMon,
          tenMon: monHoc.tenMon,
          force: Boolean(command.force)
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể xóa môn học lúc này");
    }
  }
}
