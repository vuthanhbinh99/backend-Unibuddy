import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DuLieuImportLichHoc, DuLieuLichHoc } from "../../domain/schedule.js";
import { kiemTraDuLieuLichHocHopLe, timXungDotTrongLo } from "../services/schedule-conflict.service.js";
import type { DichVuGhiLogLoiThoiKhoaBieu } from "../services/schedule-error-logger.service.js";
import type { KhoLichHoc } from "../ports/schedule.repository.js";

export type LenhXacNhanImportThoiKhoaBieu = {
  actorId: string;
  items: DuLieuImportLichHoc[];
};

type PhuThuoc = {
  khoLichHoc: KhoLichHoc;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiThoiKhoaBieu: DichVuGhiLogLoiThoiKhoaBieu;
};

export class XuLyXacNhanImportThoiKhoaBieu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXacNhanImportThoiKhoaBieu) {
    if (command.items.length === 0) {
      throw LoiUngDung.yeuCauSai("Không có dòng lịch học hợp lệ để import");
    }

    const dsLichHoc = command.items.map((item) => this.layDuLieuLichHoc(item));

    for (const [index, item] of dsLichHoc.entries()) {
      const loiDuLieu = kiemTraDuLieuLichHocHopLe(item);

      if (loiDuLieu.length > 0) {
        throw LoiUngDung.yeuCauSai(`Dòng ${command.items[index].rowIndex} không hợp lệ`, loiDuLieu);
      }

      const monHocHopLe = await this.deps.khoLichHoc.kiemTraMonHocThuocSinhVien(item.maMonHoc, command.actorId);

      if (!monHocHopLe) {
        throw LoiUngDung.khongCoQuyen(`Dòng ${command.items[index].rowIndex} có môn học không thuộc sinh viên`);
      }
    }

    const xungDotTrongLo = timXungDotTrongLo(command.items);

    if (xungDotTrongLo.size > 0) {
      throw LoiUngDung.xungDot("Phát hiện có dòng bị trùng lịch học trong file import", {
        ruleCode: "BR-SCH-01",
        rows: Array.from(xungDotTrongLo.entries()).map(([rowIndex, conflicts]) => ({ rowIndex, conflicts }))
      });
    }

    const xungDotDatabase = [];

    for (const [index, item] of dsLichHoc.entries()) {
      const xungDot = await this.deps.khoLichHoc.timXungDot(command.actorId, item);

      if (xungDot.length > 0) {
        xungDotDatabase.push({
          rowIndex: command.items[index].rowIndex,
          xungDot
        });
      }
    }

    if (xungDotDatabase.length > 0) {
      throw LoiUngDung.xungDot("Phát hiện có dòng bị trùng lịch học, vui lòng quay lại kiểm tra preview", {
        ruleCode: "BR-SCH-01",
        xungDot: xungDotDatabase
      });
    }

    try {
      const lichHoc = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const dsDaLuu = await this.deps.khoLichHoc.taoNhieu(dsLichHoc, tx);

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "SCHEDULE_IMPORTED",
            tableName: "lich_hoc",
            message: "Sinh viên import TKB tự động bằng Khớp cột thành công",
            metadata: {
              soDongImport: command.items.length,
              soDongDaLuu: dsDaLuu.length,
              ruleCode: "BR-SCH-01"
            }
          },
          tx
        );

        return dsDaLuu;
      });

      return {
        message: "Đồng bộ thành công! Thời khóa biểu của bạn đã được cập nhật.",
        importedCount: lichHoc.length,
        items: lichHoc
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghi({
        actorId: command.actorId,
        action: "SCHEDULE_IMPORT_FAILED",
        tableName: "lich_hoc",
        message: "Lỗi import thời khóa biểu vào database",
        error,
        metadata: {
          soDongImport: command.items.length
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể import thời khóa biểu lúc này");
    }
  }

  private layDuLieuLichHoc(item: DuLieuImportLichHoc): DuLieuLichHoc {
    return {
      maMonHoc: item.maMonHoc,
      thu: item.thu,
      tietBatDau: item.tietBatDau,
      soTiet: item.soTiet,
      phongHoc: item.phongHoc,
      ngayBatDau: item.ngayBatDau,
      ngayKetThuc: item.ngayKetThuc
    };
  }
}
