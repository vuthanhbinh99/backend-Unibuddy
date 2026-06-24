import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { ThongKeTrangThaiDeadline, TrangThaiDeadline } from "../../domain/deadline.js";
import type { KhoDeadline } from "../ports/deadline.repository.js";
import type { DichVuGhiLogLoiDeadline } from "../services/deadline-error-logger.service.js";

export type LenhDanhSachDeadline = {
  actorId: string;
  maMonHoc?: string;
  trangThai?: TrangThaiDeadline;
};

type PhuThuoc = {
  khoDeadline: KhoDeadline;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuGhiLogLoiDeadline: DichVuGhiLogLoiDeadline;
};

const thongKeMacDinh = (): ThongKeTrangThaiDeadline => ({
  chuaLam: 0,
  dangLam: 0,
  hoanThanh: 0,
  treHan: 0
});

export class XuLyDanhSachDeadline {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDanhSachDeadline) {
    try {
      const items = await this.deps.khoDeadline.lietKe(command);
      const thongKeTrangThai = items.reduce((result, deadline) => {
        switch (deadline.trangThai) {
          case "CHUA_LAM":
            result.chuaLam += 1;
            break;
          case "DANG_LAM":
            result.dangLam += 1;
            break;
          case "HOAN_THANH":
            result.hoanThanh += 1;
            break;
          case "TRE_HAN":
            result.treHan += 1;
            break;
        }

        return result;
      }, thongKeMacDinh());

      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "INFO",
        action: "DEADLINE_LIST_VIEWED",
        tableName: "deadline",
        message:
          items.length > 0
            ? "Sinh viên xem danh sách bài tập - Trạng thái: Có dữ liệu"
            : "Sinh viên truy cập danh sách deadline - Trạng thái: Trống (0 bản ghi)",
        metadata: {
          total: items.length,
          maMonHoc: command.maMonHoc ?? null,
          trangThai: command.trangThai ?? null,
          thongKeTrangThai
        }
      });

      return {
        message:
          items.length > 0
            ? "Tải danh sách deadline thành công"
            : "Tuyệt vời! Bạn chưa có deadline nào cần xử lý.",
        total: items.length,
        thongKeTrangThai,
        items
      };
    } catch (error) {
      await this.deps.dichVuGhiLogLoiDeadline.ghi({
        actorId: command.actorId,
        action: "DEADLINE_LIST_FAILED",
        tableName: "deadline",
        message: "Lỗi truy vấn danh sách deadline",
        error,
        metadata: {
          maMonHoc: command.maMonHoc ?? null,
          trangThai: command.trangThai ?? null
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể tải danh sách deadline lúc này");
    }
  }
}
