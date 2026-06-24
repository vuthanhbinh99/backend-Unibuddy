import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoHocPhan } from "../ports/course.repository.js";
import type { DichVuGhiLogLoiHocPhan } from "../services/course-error-logger.service.js";

export type LenhTaoHocKy = {
  actorId: string;
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

export class XuLyTaoHocKy {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoHocKy) {
    const tenHocKy = command.tenHocKy.trim();
    const hocKyDaTonTai = await this.deps.khoHocPhan.timHocKyTheoTen(command.actorId, tenHocKy);

    if (hocKyDaTonTai) {
      await this.deps.dichVuGhiLogLoiHocPhan.ghiCanhBao({
        actorId: command.actorId,
        action: "SEMESTER_CREATE_DUPLICATE",
        tableName: "hoc_ky",
        recordId: hocKyDaTonTai.maHocKy,
        message: "Sinh vien tao hoc ky that bai vi ten hoc ky da ton tai",
        metadata: {
          tenHocKy,
          existingMaHocKy: hocKyDaTonTai.maHocKy
        }
      });
      throw LoiUngDung.xungDot("Tên học kỳ đã tồn tại");
    }

    try {
      const hocKy = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const hocKyMoi = await this.deps.khoHocPhan.taoHocKy(
          {
            maNguoiDung: command.actorId,
            tenHocKy,
            ngayBatDau: command.ngayBatDau,
            ngayKetThuc: command.ngayKetThuc
          },
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "SEMESTER_CREATED",
            tableName: "hoc_ky",
            recordId: hocKyMoi.maHocKy,
            message: "Sinh viên tạo học kỳ thành công",
            metadata: {
              maHocKy: hocKyMoi.maHocKy,
              tenHocKy: hocKyMoi.tenHocKy,
              ngayBatDau: hocKyMoi.ngayBatDau,
              ngayKetThuc: hocKyMoi.ngayKetThuc
            }
          },
          tx
        );

        return hocKyMoi;
      });

      return {
        message: "Tạo học kỳ thành công",
        hocKy
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiHocPhan.ghi({
        actorId: command.actorId,
        action: "SEMESTER_CREATE_FAILED",
        tableName: "hoc_ky",
        message: "Lỗi lưu thông tin học kỳ vào database",
        error,
        metadata: {
          tenHocKy,
          ngayBatDau: command.ngayBatDau,
          ngayKetThuc: command.ngayKetThuc
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể tạo học kỳ lúc này");
    }
  }
}
