import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DuLieuLichHoc } from "../../domain/schedule.js";
import { kiemTraDuLieuLichHocHopLe } from "../services/schedule-conflict.service.js";
import type { DichVuGhiLogLoiThoiKhoaBieu } from "../services/schedule-error-logger.service.js";
import type { KhoLichHoc } from "../ports/schedule.repository.js";

export type LenhTaoLichHoc = DuLieuLichHoc & {
  actorId: string;
};

type PhuThuoc = {
  khoLichHoc: KhoLichHoc;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiThoiKhoaBieu: DichVuGhiLogLoiThoiKhoaBieu;
};

export class XuLyTaoLichHoc {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoLichHoc) {
    const data = this.layDuLieuLichHoc(command);
    const loiDuLieu = kiemTraDuLieuLichHocHopLe(data);

    if (loiDuLieu.length > 0) {
      throw LoiUngDung.yeuCauSai("Dữ liệu lịch học không hợp lệ", loiDuLieu);
    }

    const monHocHopLe = await this.deps.khoLichHoc.kiemTraMonHocThuocSinhVien(command.maMonHoc, command.actorId);

    if (!monHocHopLe) {
      throw LoiUngDung.khongCoQuyen("Không thể thêm lịch học cho môn học không thuộc sinh viên");
    }

    const xungDot = await this.deps.khoLichHoc.timXungDot(command.actorId, data);

    if (xungDot.length > 0) {
      throw LoiUngDung.xungDot("Lịch học bị trùng với môn học khác đã có sẵn", {
        ruleCode: "BR-SCH-01",
        xungDot
      });
    }

    try {
      const lichHoc = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const lichHocMoi = await this.deps.khoLichHoc.tao(data, tx);

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "SCHEDULE_CREATED",
            tableName: "lich_hoc",
            recordId: lichHocMoi.maLichHoc,
            message: "Sinh viên thêm mới lịch học",
            metadata: {
              maLichHoc: lichHocMoi.maLichHoc,
              maMonHoc: lichHocMoi.maMonHoc,
              thu: lichHocMoi.thu,
              tietBatDau: lichHocMoi.tietBatDau,
              soTiet: lichHocMoi.soTiet,
              ruleCode: "BR-SCH-01"
            }
          },
          tx
        );

        return lichHocMoi;
      });

      return {
        message: "Thêm lịch học vào thời khóa biểu thành công",
        lichHoc
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghi({
        actorId: command.actorId,
        action: "SCHEDULE_CREATE_FAILED",
        tableName: "lich_hoc",
        message: "Lỗi lưu thông tin lịch học vào database",
        error,
        metadata: {
          maMonHoc: command.maMonHoc
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể thêm lịch học lúc này");
    }
  }

  private layDuLieuLichHoc(command: LenhTaoLichHoc): DuLieuLichHoc {
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
