import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import {
  CAC_TRANG_THAI_CONG_VIEC_KANBAN,
  type CongViecKanban,
  type TrangThaiCongViecKanban
} from "../../domain/kanban.js";
import type { KhoKanban } from "../ports/kanban.repository.js";
import type { DichVuGhiLogLoiKanban } from "../services/kanban-error-logger.service.js";
import {
  assertUuid,
  canChuyenTrangThaiBangNguoiDung,
  laTruongNhom,
  taoThongTinBaoHiemUx
} from "./kanban-use-case.helpers.js";

export type NguonThaoTacTrangThaiKanban = "DRAG_DROP" | "FALLBACK_UI";

export type LenhCapNhatTrangThaiCongViecKanban = {
  actorId: string;
  maCongViec: string;
  trangThaiMoi?: string | null;
  viTriMoi?: number | null;
  nguonThaoTac?: NguonThaoTacTrangThaiKanban | null;
};

type PhuThuoc = {
  khoKanban: KhoKanban;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiKanban: DichVuGhiLogLoiKanban;
};

export class XuLyCapNhatTrangThaiCongViecKanban {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatTrangThaiCongViecKanban) {
    const maCongViec = assertUuid(command.maCongViec, "Mã công việc không hợp lệ");
    const trangThaiMoi = await this.chuanHoaTrangThai(command, maCongViec);
    const viTriMoi = this.chuanHoaViTri(command.viTriMoi);
    const nguonThaoTac = command.nguonThaoTac ?? "DRAG_DROP";
    const congViec = await this.layCongViec(command.actorId, maCongViec);
    await this.kiemTraQuyenCapNhat(command.actorId, congViec);

    try {
      const congViecDaCapNhat = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const capNhat = await this.deps.khoKanban.capNhatTrangThaiVaViTri(
          {
            maCongViec,
            maNhom: congViec.maNhom,
            trangThaiCu: congViec.trangThai,
            trangThaiMoi,
            viTriCu: congViec.viTri,
            viTriMoi
          },
          tx
        );

        if (!capNhat) {
          throw LoiUngDung.khongTimThay("Công việc không tồn tại hoặc đã bị xóa bởi thành viên khác!");
        }

        if (trangThaiMoi === "HOAN_THANH") {
          const truongNhom = await this.deps.khoKanban.lietKeTruongNhom(congViec.maNhom, tx);
          await this.deps.khoKanban.taoThongBaoNhieu(
            {
              actorId: command.actorId,
              nguoiNhanIds: truongNhom.map((item) => item.maNguoiDung),
              tieuDe: "Công việc nhóm đã hoàn thành",
              noiDung: `Công việc "${congViec.tieuDe}" đã được chuyển sang Hoàn thành.`,
              maCongViec
            },
            tx
          );
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "KANBAN_TASK_STATUS_UPDATED",
            tableName: "cong_viec_nhom",
            recordId: maCongViec,
            message: "Sinh viên cập nhật trạng thái thẻ công việc Kanban",
            metadata: {
              maNhom: congViec.maNhom,
              maCongViec,
              trangThaiCu: congViec.trangThai,
              trangThaiMoi,
              viTriCu: congViec.viTri,
              viTriMoi,
              nguonThaoTac
            }
          },
          tx
        );

        return capNhat;
      });

      return {
        message: "Cập nhật trạng thái công việc thành công!",
        congViec: congViecDaCapNhat,
        uxFallback: taoThongTinBaoHiemUx(maCongViec)
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiKanban.ghi({
        actorId: command.actorId,
        action: "KANBAN_TASK_STATUS_UPDATE_FAILED",
        tableName: "cong_viec_nhom",
        recordId: maCongViec,
        message: "Lỗi cập nhật trạng thái công việc Kanban vào database",
        error,
        metadata: {
          maNhom: congViec.maNhom,
          maCongViec,
          trangThaiCu: congViec.trangThai,
          trangThaiMoi,
          viTriMoi,
          nguonThaoTac
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể cập nhật trạng thái công việc lúc này");
    }
  }

  private async chuanHoaTrangThai(command: LenhCapNhatTrangThaiCongViecKanban, maCongViec: string): Promise<TrangThaiCongViecKanban> {
    const trangThaiMoi = command.trangThaiMoi?.trim() as TrangThaiCongViecKanban | undefined;

    if (!trangThaiMoi || !CAC_TRANG_THAI_CONG_VIEC_KANBAN.includes(trangThaiMoi)) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId: command.actorId,
        action: "KANBAN_TASK_STATUS_INVALID",
        tableName: "cong_viec_nhom",
        recordId: maCongViec,
        message: "Sinh viên cập nhật trạng thái Kanban thất bại vì trạng thái không hợp lệ",
        metadata: {
          maCongViec,
          trangThaiMoi: command.trangThaiMoi ?? null
        }
      });
      throw LoiUngDung.yeuCauSai("Trạng thái công việc không hợp lệ");
    }

    if (!canChuyenTrangThaiBangNguoiDung(trangThaiMoi)) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId: command.actorId,
        action: "KANBAN_TASK_STATUS_OVERDUE_MANUAL_DENIED",
        tableName: "cong_viec_nhom",
        recordId: maCongViec,
        message: "Sinh viên cố chuyển công việc sang Trễ hạn thủ công",
        metadata: {
          maCongViec,
          trangThaiMoi,
          ruleCode: "BR-KANBAN-OVERDUE"
        }
      });
      throw LoiUngDung.khongTheXuLy("Không thể chuyển công việc sang cột Trễ hạn thủ công. Hệ thống sẽ tự cập nhật khi quá hạn.");
    }

    return trangThaiMoi;
  }

  private chuanHoaViTri(viTriMoi?: number | null) {
    if (viTriMoi === null || viTriMoi === undefined) {
      return null;
    }

    if (!Number.isFinite(viTriMoi) || viTriMoi < 1) {
      return 1;
    }

    return Math.trunc(viTriMoi);
  }

  private async layCongViec(actorId: string, maCongViec: string) {
    const congViec = await this.deps.khoKanban.timCongViec(maCongViec);

    if (!congViec) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId,
        action: "KANBAN_TASK_STATUS_NOT_FOUND",
        tableName: "cong_viec_nhom",
        recordId: maCongViec,
        message: "Sinh viên cập nhật trạng thái Kanban thất bại vì công việc không tồn tại",
        metadata: { maCongViec }
      });
      throw LoiUngDung.khongTimThay("Công việc không tồn tại hoặc đã bị xóa bởi thành viên khác!");
    }

    return congViec;
  }

  private async kiemTraQuyenCapNhat(actorId: string, congViec: CongViecKanban) {
    const thanhVien = await this.deps.khoKanban.timThanhVien(congViec.maNhom, actorId);
    const duocGiaoChoActor = congViec.nguoiDuocGiao === actorId;

    if (!thanhVien || (!laTruongNhom(thanhVien) && !duocGiaoChoActor)) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId,
        action: "KANBAN_TASK_STATUS_UPDATE_DENIED",
        tableName: "cong_viec_nhom",
        recordId: congViec.maCongViec,
        message: "Sinh viên cập nhật trạng thái Kanban thất bại vì không có quyền thao tác",
        metadata: {
          maNhom: congViec.maNhom,
          maCongViec: congViec.maCongViec,
          role: thanhVien?.vaiTroTrongNhom ?? null,
          nguoiDuocGiao: congViec.nguoiDuocGiao,
          ruleCode: "BR-KANBAN-01"
        }
      });
      throw LoiUngDung.khongCoQuyen("Tài khoản bị khóa hoặc bạn không có quyền thao tác trong nhóm này!");
    }
  }
}
