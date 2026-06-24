import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DuLieuTaoHocPhan } from "../../domain/course.js";
import type { KhoHocPhan } from "../ports/course.repository.js";
import type { DichVuGhiLogLoiHocPhan } from "../services/course-error-logger.service.js";
import { chuanHoaDuLieuHocPhan } from "../services/course-normalization.service.js";

export type LenhTaoHocPhan = DuLieuTaoHocPhan & {
  actorId: string;
};

type PhuThuoc = {
  khoHocPhan: KhoHocPhan;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiHocPhan: DichVuGhiLogLoiHocPhan;
};

export class XuLyTaoHocPhan {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoHocPhan) {
    const data = chuanHoaDuLieuHocPhan({
      maHocKy: command.maHocKy,
      maMon: command.maMon,
      tenMon: command.tenMon,
      soTinChi: command.soTinChi
    });

    const hocKy = await this.deps.khoHocPhan.timHocKyCuaSinhVien(data.maHocKy, command.actorId);

    if (!hocKy) {
      await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
        actorId: command.actorId,
        action: "COURSE_CREATE_SEMESTER_NOT_FOUND",
        tableName: "hoc_ky",
        recordId: data.maHocKy,
        message: "Sinh viên thêm môn học thất bại vì học kỳ không tồn tại",
        metadata: {
          maHocKy: data.maHocKy,
          maMon: data.maMon,
          tenMon: data.tenMon
        }
      });
      throw LoiUngDung.khongTimThay("Không tìm thấy học kỳ để thêm môn học");
    }

    const monHocTrung = await this.deps.khoHocPhan.timTrungLap({
      actorId: command.actorId,
      maHocKy: data.maHocKy,
      maMon: data.maMon,
      tenMon: data.tenMon
    });

    if (monHocTrung) {
      await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
        actorId: command.actorId,
        action: "COURSE_CREATE_DUPLICATE",
        tableName: "mon_hoc",
        recordId: monHocTrung.maMonHoc,
        message: "Sinh viên thêm môn học thất bại vì tên môn hoặc mã môn bị trùng trong học kỳ",
        metadata: {
          maHocKy: data.maHocKy,
          maMon: data.maMon,
          tenMon: data.tenMon,
          existingMaMonHoc: monHocTrung.maMonHoc
        }
      });
      throw LoiUngDung.xungDot("Tên môn hoặc mã môn học đã tồn tại trong học kỳ này");
    }

    try {
      const monHoc = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const monHocMoi = await this.deps.khoHocPhan.tao(data, tx);

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "COURSE_CREATED",
            tableName: "mon_hoc",
            recordId: monHocMoi.maMonHoc,
            message: "Sinh viên thêm môn học mới thành công",
            metadata: {
              maMonHoc: monHocMoi.maMonHoc,
              maHocKy: monHocMoi.maHocKy,
              maMon: monHocMoi.maMon,
              tenMon: monHocMoi.tenMon,
              soTinChi: monHocMoi.soTinChi
            }
          },
          tx
        );

        return monHocMoi;
      });

      return {
        message: "Thêm môn học thành công",
        monHoc
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiHocPhan.ghi({
        actorId: command.actorId,
        action: "COURSE_CREATE_FAILED",
        tableName: "mon_hoc",
        message: "Lỗi lưu thông tin môn học vào database",
        error,
        metadata: {
          maHocKy: data.maHocKy,
          maMon: data.maMon,
          tenMon: data.tenMon
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể thêm môn học lúc này");
    }
  }
}
