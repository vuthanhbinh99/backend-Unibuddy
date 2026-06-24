import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { CongViecKanban } from "../../domain/kanban.js";
import type { KhoKanban } from "../ports/kanban.repository.js";
import type { DichVuGhiLogLoiKanban } from "../services/kanban-error-logger.service.js";
import { assertUuid, chuanHoaChuoi, chuanHoaMoTa, docNgayTuyChon, laTruongNhom } from "./kanban-use-case.helpers.js";

export type LenhCapNhatThongTinCongViecKanban = {
  actorId: string;
  maCongViec: string;
  tieuDe?: string | null;
  moTa?: string | null;
  hanHoanThanh?: string | Date | null;
};

type PhuThuoc = {
  khoKanban: KhoKanban;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiKanban: DichVuGhiLogLoiKanban;
};

export class XuLyCapNhatThongTinCongViecKanban {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatThongTinCongViecKanban) {
    const maCongViec = assertUuid(command.maCongViec, "Mã công việc không hợp lệ");
    const duLieu = await this.chuanHoaVaKiemTra(command, maCongViec);
    const congViec = await this.layCongViec(command.actorId, maCongViec);
    await this.kiemTraQuyenSua(command.actorId, congViec);

    try {
      const congViecDaCapNhat = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const capNhat = await this.deps.khoKanban.capNhatThongTinCongViec(
          maCongViec,
          {
            tieuDe: duLieu.tieuDe,
            moTa: duLieu.moTa,
            hanHoanThanh: duLieu.hanHoanThanh
          },
          tx
        );

        if (!capNhat) {
          throw LoiUngDung.khongTimThay("Công việc không tồn tại hoặc đã bị xóa bởi thành viên khác!");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "KANBAN_TASK_UPDATED",
            tableName: "cong_viec_nhom",
            recordId: maCongViec,
            message: "Sinh viên cập nhật thông tin thẻ công việc Kanban",
            metadata: {
              maNhom: congViec.maNhom,
              maCongViec,
              tieuDeCu: congViec.tieuDe,
              tieuDeMoi: duLieu.tieuDe,
              hanHoanThanhCu: congViec.hanHoanThanh?.toISOString() ?? null,
              hanHoanThanhMoi: duLieu.hanHoanThanh?.toISOString() ?? null
            }
          },
          tx
        );

        return capNhat;
      });

      return {
        message: "Cập nhật thông tin công việc thành công!",
        congViec: congViecDaCapNhat
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiKanban.ghi({
        actorId: command.actorId,
        action: "KANBAN_TASK_UPDATE_FAILED",
        tableName: "cong_viec_nhom",
        recordId: maCongViec,
        message: "Lỗi cập nhật thông tin công việc Kanban vào database",
        error,
        metadata: {
          maCongViec,
          maNhom: congViec.maNhom
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể cập nhật công việc lúc này");
    }
  }

  private async chuanHoaVaKiemTra(command: LenhCapNhatThongTinCongViecKanban, maCongViec: string) {
    const tieuDe = chuanHoaChuoi(command.tieuDe);
    const moTa = chuanHoaMoTa(command.moTa);
    const hanHoanThanh = docNgayTuyChon(command.hanHoanThanh);
    const loi: string[] = [];

    if (!tieuDe) {
      loi.push("Tiêu đề công việc không được để trống");
    }

    if (tieuDe.length > 255) {
      loi.push("Tiêu đề công việc không được vượt quá 255 ký tự");
    }

    if (command.hanHoanThanh && !hanHoanThanh) {
      loi.push("Hạn chót công việc không hợp lệ");
    } else if (hanHoanThanh && hanHoanThanh.getTime() <= Date.now()) {
      loi.push("Hạn chót công việc phải thuộc tương lai");
    }

    if (loi.length > 0) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId: command.actorId,
        action: "KANBAN_TASK_UPDATE_VALIDATION_FAILED",
        tableName: "cong_viec_nhom",
        recordId: maCongViec,
        message: "Yêu cầu cập nhật công việc Kanban thất bại do dữ liệu đầu vào không hợp lệ",
        metadata: {
          maCongViec,
          errors: loi
        }
      });
      throw LoiUngDung.yeuCauSai("Dữ liệu nhập không hợp lệ. Vui lòng kiểm tra lại!", loi);
    }

    return { tieuDe, moTa, hanHoanThanh };
  }

  private async layCongViec(actorId: string, maCongViec: string) {
    const congViec = await this.deps.khoKanban.timCongViec(maCongViec);

    if (!congViec) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId,
        action: "KANBAN_TASK_UPDATE_NOT_FOUND",
        tableName: "cong_viec_nhom",
        recordId: maCongViec,
        message: "Sinh viên cập nhật công việc Kanban thất bại vì công việc không tồn tại",
        metadata: { maCongViec }
      });
      throw LoiUngDung.khongTimThay("Công việc không tồn tại hoặc đã bị xóa bởi thành viên khác!");
    }

    return congViec;
  }

  private async kiemTraQuyenSua(actorId: string, congViec: CongViecKanban) {
    const thanhVien = await this.deps.khoKanban.timThanhVien(congViec.maNhom, actorId);

    if (!laTruongNhom(thanhVien)) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId,
        action: "KANBAN_TASK_UPDATE_DENIED",
        tableName: "cong_viec_nhom",
        recordId: congViec.maCongViec,
        message: "Sinh viên cập nhật công việc Kanban thất bại vì không có quyền trong nhóm",
        metadata: {
          maNhom: congViec.maNhom,
          maCongViec: congViec.maCongViec,
          role: thanhVien?.vaiTroTrongNhom ?? null,
          ruleCode: "BR-KANBAN-01"
        }
      });
      throw LoiUngDung.khongCoQuyen("Tài khoản bị khóa hoặc bạn không có quyền thao tác trong nhóm này!");
    }
  }
}
