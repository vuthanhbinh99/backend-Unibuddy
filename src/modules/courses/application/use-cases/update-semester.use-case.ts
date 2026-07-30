import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoHocPhan } from "../ports/course.repository.js";
import type { DichVuGhiLogLoiHocPhan } from "../services/course-error-logger.service.js";

export type LenhCapNhatHocKy = {
  actorId: string;
  maHocKy: string;
  tenHocKy: string;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
};

type PhuThuoc = {
  khoHocPhan: KhoHocPhan;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiHocPhan: DichVuGhiLogLoiHocPhan;
};

export class XuLyCapNhatHocKy {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatHocKy) {
    const tenHocKy = command.tenHocKy.trim();
    const hocKyHienTai = await this.deps.khoHocPhan.timHocKyCuaSinhVien(command.maHocKy, command.actorId);

    if (!hocKyHienTai) {
      await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
        actorId: command.actorId,
        action: "SEMESTER_UPDATE_NOT_FOUND",
        tableName: "hoc_ky",
        recordId: command.maHocKy,
        message: "Sinh viên cập nhật học kỳ thất bại vì học kỳ không tồn tại hoặc không thuộc sinh viên",
        metadata: {
          maHocKy: command.maHocKy
        }
      });
      throw LoiUngDung.khongTimThay("Không tìm thấy học kỳ để cập nhật");
    }

    const hocKyTrung = await this.deps.khoHocPhan.timHocKyTheoTen(command.actorId, tenHocKy);

    if (hocKyTrung && hocKyTrung.maHocKy !== command.maHocKy) {
      await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
        actorId: command.actorId,
        action: "SEMESTER_UPDATE_DUPLICATE",
        tableName: "hoc_ky",
        recordId: command.maHocKy,
        message: "Sinh viên cập nhật học kỳ thất bại vì tên học kỳ đã tồn tại",
        metadata: {
          tenHocKy,
          existingMaHocKy: hocKyTrung.maHocKy
        }
      });
      throw LoiUngDung.xungDot("Tên học kỳ đã tồn tại");
    }

    try {
      const hocKy = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const hocKyDaCapNhat = await this.deps.khoHocPhan.capNhatHocKy(
          command.maHocKy,
          {
            tenHocKy,
            ngayBatDau: command.ngayBatDau,
            ngayKetThuc: command.ngayKetThuc
          },
          tx
        );

        if (!hocKyDaCapNhat) {
          await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
            actorId: command.actorId,
            action: "SEMESTER_UPDATE_NOT_FOUND_DURING_TRANSACTION",
            tableName: "hoc_ky",
            recordId: command.maHocKy,
            message: "Sinh viên cập nhật học kỳ thất bại vì bản ghi không còn tồn tại trong giao dịch",
            metadata: {
              maHocKy: command.maHocKy
            }
          });
          throw LoiUngDung.khongTimThay("Không tìm thấy học kỳ để cập nhật");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "SEMESTER_UPDATED",
            tableName: "hoc_ky",
            recordId: command.maHocKy,
            message: "Sinh viên chỉnh sửa thông tin học kỳ thành công",
            metadata: {
              maHocKy: command.maHocKy,
              tenHocKyCu: hocKyHienTai.tenHocKy,
              tenHocKyMoi: hocKyDaCapNhat.tenHocKy,
              ngayBatDauCu: hocKyHienTai.ngayBatDau,
              ngayBatDauMoi: hocKyDaCapNhat.ngayBatDau,
              ngayKetThucCu: hocKyHienTai.ngayKetThuc,
              ngayKetThucMoi: hocKyDaCapNhat.ngayKetThuc
            }
          },
          tx
        );

        return hocKyDaCapNhat;
      });

      return {
        message: "Cập nhật học kỳ thành công",
        hocKy
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiHocPhan.ghi({
        actorId: command.actorId,
        action: "SEMESTER_UPDATE_FAILED",
        tableName: "hoc_ky",
        recordId: command.maHocKy,
        message: "Lỗi cập nhật thông tin học kỳ vào Cơ sở dữ liệu",
        error,
        metadata: {
          maHocKy: command.maHocKy,
          tenHocKy,
          ngayBatDau: command.ngayBatDau,
          ngayKetThuc: command.ngayKetThuc
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể cập nhật học kỳ lúc này");
    }
  }
}
