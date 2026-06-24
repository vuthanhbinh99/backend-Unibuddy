import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { CongViecKanban } from "../../domain/kanban.js";
import type { KhoKanban } from "../ports/kanban.repository.js";
import type { DichVuGhiLogLoiKanban } from "../services/kanban-error-logger.service.js";
import { assertUuid } from "./kanban-use-case.helpers.js";

export type LenhBinhLuanCongViecKanban = {
  actorId: string;
  maCongViec: string;
  noiDung?: string | null;
};

type PhuThuoc = {
  khoKanban: KhoKanban;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiKanban: DichVuGhiLogLoiKanban;
};

export class XuLyBinhLuanCongViecKanban {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhBinhLuanCongViecKanban) {
    const maCongViec = assertUuid(command.maCongViec, "Mã công việc không hợp lệ");
    const noiDung = command.noiDung?.trim() ?? "";

    if (!noiDung) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId: command.actorId,
        action: "KANBAN_TASK_COMMENT_EMPTY",
        tableName: "binh_luan_cong_viec",
        recordId: maCongViec,
        message: "Sinh viên gửi bình luận công việc thất bại vì nội dung trống",
        metadata: { maCongViec }
      });
      throw LoiUngDung.yeuCauSai("Vui lòng nhập nội dung trước khi gửi!");
    }

    const congViec = await this.layCongViec(command.actorId, maCongViec);
    await this.kiemTraQuyenBinhLuan(command.actorId, congViec);

    try {
      const binhLuan = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const binhLuanMoi = await this.deps.khoKanban.taoBinhLuan(
          {
            maCongViec,
            maNguoiDung: command.actorId,
            noiDung
          },
          tx
        );
        const truongNhom = await this.deps.khoKanban.lietKeTruongNhom(congViec.maNhom, tx);
        const nguoiNhanThongBao = [
          ...truongNhom.map((item) => item.maNguoiDung),
          ...(congViec.nguoiDuocGiao ? [congViec.nguoiDuocGiao] : [])
        ];

        await this.deps.khoKanban.taoThongBaoNhieu(
          {
            actorId: command.actorId,
            nguoiNhanIds: nguoiNhanThongBao,
            tieuDe: "Có bình luận mới trong công việc nhóm",
            noiDung: `Công việc "${congViec.tieuDe}" có bình luận mới.`,
            maCongViec
          },
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "KANBAN_TASK_COMMENTED",
            tableName: "binh_luan_cong_viec",
            recordId: binhLuanMoi.maBinhLuan,
            message: "Sinh viên đăng bình luận trao đổi trong công việc",
            metadata: {
              maNhom: congViec.maNhom,
              maCongViec,
              maBinhLuan: binhLuanMoi.maBinhLuan
            }
          },
          tx
        );

        return binhLuanMoi;
      });

      return {
        message: "Gửi bình luận thành công",
        binhLuan
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiKanban.ghi({
        actorId: command.actorId,
        action: "KANBAN_TASK_COMMENT_FAILED",
        tableName: "binh_luan_cong_viec",
        recordId: maCongViec,
        message: "Lỗi lưu bình luận công việc Kanban vào database",
        error,
        metadata: {
          maNhom: congViec.maNhom,
          maCongViec
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể gửi bình luận lúc này");
    }
  }

  private async layCongViec(actorId: string, maCongViec: string) {
    const congViec = await this.deps.khoKanban.timCongViec(maCongViec);

    if (!congViec) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId,
        action: "KANBAN_TASK_COMMENT_NOT_FOUND",
        tableName: "cong_viec_nhom",
        recordId: maCongViec,
        message: "Sinh viên bình luận công việc thất bại vì công việc không tồn tại",
        metadata: { maCongViec }
      });
      throw LoiUngDung.khongTimThay("Công việc không tồn tại hoặc đã bị xóa bởi thành viên khác!");
    }

    return congViec;
  }

  private async kiemTraQuyenBinhLuan(actorId: string, congViec: CongViecKanban) {
    const thanhVien = await this.deps.khoKanban.timThanhVien(congViec.maNhom, actorId);

    if (!thanhVien) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId,
        action: "KANBAN_TASK_COMMENT_DENIED",
        tableName: "binh_luan_cong_viec",
        recordId: congViec.maCongViec,
        message: "Sinh viên bình luận công việc thất bại vì không còn thuộc nhóm",
        metadata: {
          maNhom: congViec.maNhom,
          maCongViec: congViec.maCongViec
        }
      });
      throw LoiUngDung.khongCoQuyen("Thao tác thất bại! Tài khoản của bạn đã bị khóa hoặc bạn không còn ở trong nhóm này!");
    }
  }
}
