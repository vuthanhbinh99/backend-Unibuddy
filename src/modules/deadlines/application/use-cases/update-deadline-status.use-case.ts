import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import { laTrangThaiDeadline, type TrangThaiDeadline } from "../../domain/deadline.js";
import type { KhoDeadline } from "../ports/deadline.repository.js";
import type { DichVuGhiLogLoiDeadline } from "../services/deadline-error-logger.service.js";

export type LenhCapNhatTrangThaiDeadline = {
  actorId: string;
  maDeadline: string;
  trangThai?: string | null;
};

type PhuThuoc = {
  khoDeadline: KhoDeadline;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiDeadline: DichVuGhiLogLoiDeadline;
};

export class XuLyCapNhatTrangThaiDeadline {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatTrangThaiDeadline) {
    const trangThaiMoi = await this.kiemTraTrangThai(command);
    const deadlineHienTai = await this.deps.khoDeadline.timTheoMaCuaSinhVien(
      command.maDeadline,
      command.actorId
    );

    if (!deadlineHienTai) {
      await this.deps.dichVuGhiLogLoiDeadline.ghiCanhBao({
        actorId: command.actorId,
        action: "DEADLINE_STATUS_UPDATE_NOT_FOUND",
        tableName: "deadline",
        recordId: command.maDeadline,
        message: "Sinh viên cập nhật trạng thái deadline thất bại vì không tìm thấy bản ghi",
        metadata: {
          maDeadline: command.maDeadline,
          trangThaiMoi
        }
      });
      throw LoiUngDung.khongTimThay("Không tìm thấy deadline cần cập nhật");
    }

    try {
      const deadline = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const deadlineDaCapNhat = await this.deps.khoDeadline.capNhatTrangThai(
          command.maDeadline,
          trangThaiMoi,
          tx
        );

        if (!deadlineDaCapNhat) {
          await this.deps.dichVuGhiLogLoiDeadline.ghiCanhBao({
            actorId: command.actorId,
            action: "DEADLINE_STATUS_UPDATE_NOT_FOUND_DURING_TRANSACTION",
            tableName: "deadline",
            recordId: command.maDeadline,
            message: "Sinh viên cập nhật trạng thái deadline thất bại vì bản ghi không còn tồn tại trong transaction",
            metadata: {
              maDeadline: command.maDeadline,
              trangThaiCu: deadlineHienTai.trangThai,
              trangThaiMoi
            }
          });
          throw LoiUngDung.khongTimThay("Không tìm thấy deadline cần cập nhật");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "DEADLINE_STATUS_UPDATED",
            tableName: "deadline",
            recordId: command.maDeadline,
            message:
              trangThaiMoi === "HOAN_THANH"
                ? "Sinh viên hoàn thành deadline"
                : "Sinh viên cập nhật trạng thái deadline thành công",
            metadata: {
              maDeadline: command.maDeadline,
              maMonHoc: deadlineHienTai.maMonHoc,
              tieuDe: deadlineHienTai.tieuDe,
              trangThaiCu: deadlineHienTai.trangThai,
              trangThaiMoi
            }
          },
          tx
        );

        return deadlineDaCapNhat;
      });

      return {
        message:
          trangThaiMoi === "HOAN_THANH"
            ? "Đã đánh dấu hoàn thành bài tập!"
            : "Cập nhật trạng thái deadline thành công!",
        deadline
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiDeadline.ghi({
        actorId: command.actorId,
        action: "DEADLINE_STATUS_UPDATE_FAILED",
        tableName: "deadline",
        recordId: command.maDeadline,
        message: "Lỗi cập nhật trạng thái deadline",
        error,
        metadata: {
          maDeadline: command.maDeadline,
          trangThaiCu: deadlineHienTai.trangThai,
          trangThaiMoi
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Không thể cập nhật trạng thái, vui lòng thử lại sau!");
    }
  }

  private async kiemTraTrangThai(command: LenhCapNhatTrangThaiDeadline): Promise<TrangThaiDeadline> {
    const trangThai = command.trangThai?.trim() ?? "";

    if (!laTrangThaiDeadline(trangThai)) {
      await this.deps.dichVuGhiLogLoiDeadline.ghiCanhBao({
        actorId: command.actorId,
        action: "DEADLINE_STATUS_UPDATE_VALIDATION_FAILED",
        tableName: "deadline",
        recordId: command.maDeadline,
        message: "Sinh viên cập nhật trạng thái deadline thất bại do trạng thái không hợp lệ",
        metadata: {
          maDeadline: command.maDeadline,
          trangThai
        }
      });
      throw LoiUngDung.yeuCauSai("Trạng thái deadline không hợp lệ");
    }

    return trangThai;
  }
}
