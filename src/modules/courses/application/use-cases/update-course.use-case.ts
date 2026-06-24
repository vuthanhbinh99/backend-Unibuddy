import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DuLieuCapNhatHocPhan } from "../../domain/course.js";
import type { KhoHocPhan } from "../ports/course.repository.js";
import type { DichVuGhiLogLoiHocPhan } from "../services/course-error-logger.service.js";
import { chuanHoaDuLieuHocPhan } from "../services/course-normalization.service.js";

export type LenhCapNhatHocPhan = DuLieuCapNhatHocPhan & {
  actorId: string;
  maMonHoc: string;
};

type PhuThuoc = {
  khoHocPhan: KhoHocPhan;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiHocPhan: DichVuGhiLogLoiHocPhan;
};

export class XuLyCapNhatHocPhan {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatHocPhan) {
    const monHocHienTai = await this.deps.khoHocPhan.timTheoMaCuaSinhVien(command.maMonHoc, command.actorId);

    if (!monHocHienTai) {
      await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
        actorId: command.actorId,
        action: "COURSE_UPDATE_NOT_FOUND",
        tableName: "mon_hoc",
        recordId: command.maMonHoc,
        message: "Sinh viên cập nhật môn học thất bại vì môn học không tồn tại hoặc không thuộc sinh viên",
        metadata: {
          maMonHoc: command.maMonHoc
        }
      });
      throw LoiUngDung.khongTimThay("Không tìm thấy môn học để cập nhật");
    }

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
        action: "COURSE_UPDATE_SEMESTER_NOT_FOUND",
        tableName: "hoc_ky",
        recordId: data.maHocKy,
        message: "Sinh viên cập nhật môn học thất bại vì học kỳ mới không tồn tại hoặc không thuộc sinh viên",
        metadata: {
          maMonHoc: command.maMonHoc,
          maHocKy: data.maHocKy
        }
      });
      throw LoiUngDung.khongTimThay("Không tìm thấy học kỳ để cập nhật môn học");
    }

    const monHocTrung = await this.deps.khoHocPhan.timTrungLap({
      actorId: command.actorId,
      maHocKy: data.maHocKy,
      maMon: data.maMon,
      tenMon: data.tenMon,
      loaiTruMaMonHoc: command.maMonHoc
    });

    if (monHocTrung) {
      await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
        actorId: command.actorId,
        action: "COURSE_UPDATE_DUPLICATE",
        tableName: "mon_hoc",
        recordId: command.maMonHoc,
        message: "Sinh viên cập nhật môn học thất bại vì tên môn hoặc mã môn bị trùng trong học kỳ",
        metadata: {
          maMonHoc: command.maMonHoc,
          maHocKy: data.maHocKy,
          maMon: data.maMon,
          tenMon: data.tenMon,
          existingMaMonHoc: monHocTrung.maMonHoc
        }
      });
      throw LoiUngDung.xungDot("Tên hoặc mã môn học bị trùng, vui lòng kiểm tra lại");
    }

    try {
      const monHoc = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const monHocDaCapNhat = await this.deps.khoHocPhan.capNhat(command.maMonHoc, data, tx);

        if (!monHocDaCapNhat) {
          await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
            actorId: command.actorId,
            action: "COURSE_UPDATE_NOT_FOUND_DURING_TRANSACTION",
            tableName: "mon_hoc",
            recordId: command.maMonHoc,
            message: "Sinh viên cập nhật môn học thất bại vì bản ghi không còn tồn tại trong giao dịch",
            metadata: {
              maMonHoc: command.maMonHoc,
              maHocKy: data.maHocKy
            }
          });
          throw LoiUngDung.khongTimThay("Không tìm thấy môn học để cập nhật");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "COURSE_UPDATED",
            tableName: "mon_hoc",
            recordId: command.maMonHoc,
            message: "Sinh viên chỉnh sửa thông tin môn học thành công",
            metadata: {
              maMonHoc: command.maMonHoc,
              maHocKyCu: monHocHienTai.maHocKy,
              maHocKyMoi: monHocDaCapNhat.maHocKy,
              maMonCu: monHocHienTai.maMon,
              maMonMoi: monHocDaCapNhat.maMon,
              tenMonCu: monHocHienTai.tenMon,
              tenMonMoi: monHocDaCapNhat.tenMon,
              soTinChiCu: monHocHienTai.soTinChi,
              soTinChiMoi: monHocDaCapNhat.soTinChi
            }
          },
          tx
        );

        return monHocDaCapNhat;
      });

      return {
        message: "Cập nhật thông tin môn học thành công",
        monHoc
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiHocPhan.ghi({
        actorId: command.actorId,
        action: "COURSE_UPDATE_FAILED",
        tableName: "mon_hoc",
        recordId: command.maMonHoc,
        message: "Lỗi cập nhật thông tin môn học vào Cơ sở dữ liệu",
        error,
        metadata: {
          maMonHoc: command.maMonHoc,
          maHocKy: data.maHocKy,
          maMon: data.maMon,
          tenMon: data.tenMon
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể cập nhật môn học lúc này");
    }
  }
}
