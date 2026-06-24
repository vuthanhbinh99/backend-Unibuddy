import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoKanban } from "../ports/kanban.repository.js";
import type { DichVuGhiLogLoiKanban } from "../services/kanban-error-logger.service.js";
import { assertUuid } from "./kanban-use-case.helpers.js";

export type LenhThuHoiBinhLuanCongViecKanban = {
  actorId: string;
  maCongViec: string;
  maBinhLuan: string;
};

type PhuThuoc = {
  khoKanban: KhoKanban;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiKanban: DichVuGhiLogLoiKanban;
};

export class XuLyThuHoiBinhLuanCongViecKanban {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhThuHoiBinhLuanCongViecKanban) {
    const maCongViec = assertUuid(command.maCongViec, "Mã công việc không hợp lệ");
    const maBinhLuan = assertUuid(command.maBinhLuan, "Mã bình luận không hợp lệ");
    const [congViec, binhLuan] = await Promise.all([
      this.deps.khoKanban.timCongViec(maCongViec),
      this.deps.khoKanban.timBinhLuan(maBinhLuan)
    ]);

    if (!congViec) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId: command.actorId,
        action: "KANBAN_TASK_COMMENT_REVOKE_TASK_NOT_FOUND",
        tableName: "cong_viec_nhom",
        recordId: maCongViec,
        message: "Sinh viên thu hồi bình luận thất bại vì công việc không tồn tại",
        metadata: { maCongViec, maBinhLuan }
      });
      throw LoiUngDung.khongTimThay("Công việc không tồn tại hoặc đã bị xóa bởi thành viên khác!");
    }

    if (!binhLuan || binhLuan.maCongViec !== maCongViec) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId: command.actorId,
        action: "KANBAN_TASK_COMMENT_REVOKE_NOT_FOUND",
        tableName: "binh_luan_cong_viec",
        recordId: maBinhLuan,
        message: "Sinh viên thu hồi bình luận thất bại vì bình luận không tồn tại trong công việc",
        metadata: { maCongViec, maBinhLuan }
      });
      throw LoiUngDung.khongTimThay("Bình luận không tồn tại hoặc đã được thu hồi trước đó!");
    }

    const thanhVien = await this.deps.khoKanban.timThanhVien(congViec.maNhom, command.actorId);

    if (!thanhVien) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId: command.actorId,
        action: "KANBAN_TASK_COMMENT_REVOKE_MEMBERSHIP_DENIED",
        tableName: "binh_luan_cong_viec",
        recordId: maBinhLuan,
        message: "Sinh viên thu hồi bình luận thất bại vì không còn thuộc nhóm",
        metadata: {
          maNhom: congViec.maNhom,
          maCongViec,
          maBinhLuan
        }
      });
      throw LoiUngDung.khongCoQuyen("Bạn không có quyền thu hồi bình luận trong nhóm này!");
    }

    if (binhLuan.maNguoiDung !== command.actorId) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId: command.actorId,
        action: "KANBAN_TASK_COMMENT_REVOKE_DENIED",
        tableName: "binh_luan_cong_viec",
        recordId: maBinhLuan,
        message: "Sinh viên thu hồi bình luận thất bại vì không phải người gửi bình luận",
        metadata: {
          maNhom: congViec.maNhom,
          maCongViec,
          maBinhLuan,
          chuSoHuuBinhLuan: binhLuan.maNguoiDung,
          ruleCode: "BR-KANBAN-COMMENT-OWNER"
        }
      });
      throw LoiUngDung.khongCoQuyen("Bạn chỉ có thể thu hồi bình luận do chính mình gửi!");
    }

    try {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const daXoa = await this.deps.khoKanban.xoaBinhLuan(maBinhLuan, tx);

        if (!daXoa) {
          throw LoiUngDung.khongTimThay("Bình luận không tồn tại hoặc đã được thu hồi trước đó!");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "KANBAN_TASK_COMMENT_REVOKED",
            tableName: "binh_luan_cong_viec",
            recordId: maBinhLuan,
            message: "Sinh viên thu hồi bình luận trong công việc Kanban",
            metadata: {
              maNhom: congViec.maNhom,
              maCongViec,
              maBinhLuan
            }
          },
          tx
        );
      });

      return {
        message: "Đã thu hồi bình luận thành công",
        maBinhLuan
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiKanban.ghi({
        actorId: command.actorId,
        action: "KANBAN_TASK_COMMENT_REVOKE_FAILED",
        tableName: "binh_luan_cong_viec",
        recordId: maBinhLuan,
        message: "Lỗi thu hồi bình luận công việc Kanban trong database",
        error,
        metadata: {
          maNhom: congViec.maNhom,
          maCongViec,
          maBinhLuan
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể thu hồi bình luận lúc này");
    }
  }
}
