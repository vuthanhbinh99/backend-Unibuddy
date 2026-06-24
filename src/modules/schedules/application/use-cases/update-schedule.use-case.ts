import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DuLieuLichHoc } from "../../domain/schedule.js";
import { kiemTraDuLieuLichHocHopLe } from "../services/schedule-conflict.service.js";
import type { DichVuGhiLogLoiThoiKhoaBieu } from "../services/schedule-error-logger.service.js";
import type { KhoLichHoc } from "../ports/schedule.repository.js";

export type LenhCapNhatLichHoc = DuLieuLichHoc & {
  actorId: string;
  maLichHoc: string;
};

type PhuThuoc = {
  khoLichHoc: KhoLichHoc;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiThoiKhoaBieu: DichVuGhiLogLoiThoiKhoaBieu;
};

export class XuLyCapNhatLichHoc {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatLichHoc) {
    const lichHocHienTai = await this.deps.khoLichHoc.timTheoMaCuaSinhVien(command.maLichHoc, command.actorId);

    if (!lichHocHienTai) {
      await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghiCanhBao({
        actorId: command.actorId,
        action: "SCHEDULE_UPDATE_NOT_FOUND",
        tableName: "lich_hoc",
        recordId: command.maLichHoc,
        message: "Sinh vien cap nhat lich hoc that bai vi khong tim thay lich hoc",
        metadata: {
          maLichHoc: command.maLichHoc
        }
      });
      throw LoiUngDung.khongTimThay("Không tìm thấy lịch học");
    }

    const data = this.layDuLieuLichHoc(command);
    const loiDuLieu = kiemTraDuLieuLichHocHopLe(data);

    if (loiDuLieu.length > 0) {
      await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghiCanhBao({
        actorId: command.actorId,
        action: "SCHEDULE_UPDATE_VALIDATION_FAILED",
        tableName: "lich_hoc",
        recordId: command.maLichHoc,
        message: "Sinh vien cap nhat lich hoc that bai vi du lieu khong hop le",
        metadata: {
          maLichHoc: command.maLichHoc,
          maMonHoc: command.maMonHoc,
          errors: loiDuLieu
        }
      });
      throw LoiUngDung.yeuCauSai("Dữ liệu lịch học không hợp lệ", loiDuLieu);
    }

    const monHocHopLe = await this.deps.khoLichHoc.kiemTraMonHocThuocSinhVien(command.maMonHoc, command.actorId);

    if (!monHocHopLe) {
      await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghiCanhBao({
        actorId: command.actorId,
        action: "SCHEDULE_UPDATE_COURSE_FORBIDDEN",
        tableName: "lich_hoc",
        recordId: command.maLichHoc,
        message: "Sinh vien cap nhat lich hoc that bai vi mon hoc moi khong thuoc sinh vien",
        metadata: {
          maLichHoc: command.maLichHoc,
          maMonHoc: command.maMonHoc
        }
      });
      throw LoiUngDung.khongCoQuyen("Không thể cập nhật lịch học sang môn học không thuộc sinh viên");
    }

    const xungDot = await this.deps.khoLichHoc.timXungDot(command.actorId, data, command.maLichHoc);

    if (xungDot.length > 0) {
      await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghiCanhBao({
        actorId: command.actorId,
        action: "SCHEDULE_UPDATE_CONFLICT",
        tableName: "lich_hoc",
        recordId: command.maLichHoc,
        message: "Sinh vien cap nhat lich hoc that bai vi trung lich BR-SCH-01",
        metadata: {
          maLichHoc: command.maLichHoc,
          maMonHoc: command.maMonHoc,
          ruleCode: "BR-SCH-01",
          xungDot
        }
      });
      throw LoiUngDung.xungDot("Thời gian chỉnh sửa bị trùng với lịch học khác của sinh viên", {
        ruleCode: "BR-SCH-01",
        xungDot
      });
    }

    try {
      const lichHoc = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const lichHocMoi = await this.deps.khoLichHoc.capNhat(command.maLichHoc, data, tx);

        if (!lichHocMoi) {
          await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghiCanhBao({
            actorId: command.actorId,
            action: "SCHEDULE_UPDATE_NOT_FOUND_DURING_TRANSACTION",
            tableName: "lich_hoc",
            recordId: command.maLichHoc,
            message: "Sinh vien cap nhat lich hoc that bai vi ban ghi khong con ton tai trong transaction",
            metadata: {
              maLichHoc: command.maLichHoc,
              maMonHoc: command.maMonHoc
            }
          });
          throw LoiUngDung.khongTimThay("Không tìm thấy lịch học");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "SCHEDULE_UPDATED",
            tableName: "lich_hoc",
            recordId: command.maLichHoc,
            message: "Sinh viên chỉnh sửa lịch học",
            metadata: {
              maLichHoc: command.maLichHoc,
              maMonHocCu: lichHocHienTai.maMonHoc,
              maMonHocMoi: lichHocMoi.maMonHoc,
              thuCu: lichHocHienTai.thu,
              thuMoi: lichHocMoi.thu,
              tietBatDauMoi: lichHocMoi.tietBatDau,
              soTietMoi: lichHocMoi.soTiet,
              ruleCode: "BR-SCH-01"
            }
          },
          tx
        );

        return lichHocMoi;
      });

      return {
        message: "Cập nhật thông tin lịch học thành công",
        lichHoc
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghi({
        actorId: command.actorId,
        action: "SCHEDULE_UPDATE_FAILED",
        tableName: "lich_hoc",
        recordId: command.maLichHoc,
        message: "Lỗi cập nhật thông tin lịch học trong database",
        error,
        metadata: {
          maLichHoc: command.maLichHoc
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể cập nhật lịch học lúc này");
    }
  }

  private layDuLieuLichHoc(command: LenhCapNhatLichHoc): DuLieuLichHoc {
    return {
      maMonHoc: command.maMonHoc,
      thu: command.thu,
      tietBatDau: command.tietBatDau,
      soTiet: command.soTiet,
      phongHoc: command.phongHoc,
      ngayBatDau: command.ngayBatDau,
      ngayKetThuc: command.ngayKetThuc
    };
  }
}
