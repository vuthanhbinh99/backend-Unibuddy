import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { CongViecKanban } from "../../domain/kanban.js";
import type { KhoKanban } from "../ports/kanban.repository.js";
import type { DichVuGhiLogLoiKanban } from "../services/kanban-error-logger.service.js";
import { assertUuid, laTruongNhom } from "./kanban-use-case.helpers.js";

export type LenhXoaCongViecKanban = {
  actorId: string;
  maCongViec: string;
};

type PhuThuoc = {
  khoKanban: KhoKanban;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiKanban: DichVuGhiLogLoiKanban;
};

export class XuLyXoaCongViecKanban {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXoaCongViecKanban) {
    const maCongViec = assertUuid(command.maCongViec, "Mã công việc không hợp lệ");
    const congViec = await this.layCongViec(command.actorId, maCongViec);
    await this.kiemTraQuyenXoa(command.actorId, congViec);

    try {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const soTaiLieuDaDanhDauXoa = await this.deps.khoKanban.danhDauXoaTaiLieuTheoCongViec(maCongViec, tx);
        const soThongBaoDaXoa = await this.deps.khoKanban.xoaThongBaoTheoCongViec(
          {
            maCongViec,
            maNhom: congViec.maNhom,
            tieuDeCongViec: congViec.tieuDe
          },
          tx
        );
        const soBinhLuanDaXoa = await this.deps.khoKanban.xoaBinhLuanTheoCongViec(maCongViec, tx);
        const daXoa = await this.deps.khoKanban.xoaCongViec(maCongViec, tx);

        if (!daXoa) {
          throw LoiUngDung.khongTimThay("Công việc không tồn tại hoặc đã bị xóa bởi thành viên khác!");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "KANBAN_TASK_DELETED",
            tableName: "cong_viec_nhom",
            recordId: maCongViec,
            message: "Sinh viên xóa thẻ công việc trên bảng Kanban nhóm",
            metadata: {
              maNhom: congViec.maNhom,
              maCongViec,
              tieuDe: congViec.tieuDe,
              soBinhLuanDaXoa,
              soTaiLieuDaDanhDauXoa,
              soThongBaoDaXoa,
              ruleCode: "BR-KANBAN-02"
            }
          },
          tx
        );
      });

      return {
        message: "Xóa công việc thành công!",
        maCongViec
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiKanban.ghi({
        actorId: command.actorId,
        action: "KANBAN_TASK_DELETE_FAILED",
        tableName: "cong_viec_nhom",
        recordId: maCongViec,
        message: "Lỗi hệ thống khi thực hiện xóa công việc Kanban",
        error,
        metadata: {
          maNhom: congViec.maNhom,
          maCongViec
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Xóa thất bại, vui lòng thử lại sau!");
    }
  }

  private async layCongViec(actorId: string, maCongViec: string) {
    const congViec = await this.deps.khoKanban.timCongViec(maCongViec);

    if (!congViec) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId,
        action: "KANBAN_TASK_DELETE_NOT_FOUND",
        tableName: "cong_viec_nhom",
        recordId: maCongViec,
        message: "Sinh viên xóa công việc Kanban thất bại vì công việc không tồn tại",
        metadata: { maCongViec }
      });
      throw LoiUngDung.khongTimThay("Công việc không tồn tại hoặc đã bị xóa bởi thành viên khác!");
    }

    return congViec;
  }

  private async kiemTraQuyenXoa(actorId: string, congViec: CongViecKanban) {
    const thanhVien = await this.deps.khoKanban.timThanhVien(congViec.maNhom, actorId);

    if (!laTruongNhom(thanhVien)) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId,
        action: "KANBAN_TASK_DELETE_DENIED",
        tableName: "cong_viec_nhom",
        recordId: congViec.maCongViec,
        message: "Sinh viên xóa công việc Kanban thất bại vì vi phạm quy tắc xóa công việc",
        metadata: {
          maNhom: congViec.maNhom,
          maCongViec: congViec.maCongViec,
          role: thanhVien?.vaiTroTrongNhom ?? null,
          ruleCode: "BR-KANBAN-02"
        }
      });
      throw LoiUngDung.khongCoQuyen("Bạn không phải Trưởng nhóm, không có quyền xóa công việc này!");
    }
  }
}
