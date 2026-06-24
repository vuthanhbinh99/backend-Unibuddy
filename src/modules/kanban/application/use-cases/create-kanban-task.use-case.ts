import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { NguoiThamGiaKanban } from "../../domain/kanban.js";
import type { KhoKanban } from "../ports/kanban.repository.js";
import type { DichVuGhiLogLoiKanban } from "../services/kanban-error-logger.service.js";
import { assertUuid, chuanHoaChuoi, chuanHoaMoTa, docNgayTuyChon, laTruongNhom, laUuid } from "./kanban-use-case.helpers.js";

export type LenhTaoCongViecKanban = {
  actorId: string;
  maNhom: string;
  tieuDe?: string | null;
  moTa?: string | null;
  hanHoanThanh?: string | Date | null;
  nguoiDuocGiao?: string | null;
};

type DuLieuHopLe = {
  maNhom: string;
  tieuDe: string;
  moTa: string | null;
  hanHoanThanh: Date | null;
  nguoiDuocGiao: string | null;
};

type PhuThuoc = {
  khoKanban: KhoKanban;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiKanban: DichVuGhiLogLoiKanban;
};

export class XuLyTaoCongViecKanban {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoCongViecKanban) {
    const duLieu = await this.chuanHoaVaKiemTra(command);
    const thanhVien = await this.layVaKiemTraQuyenTao(command.actorId, duLieu.maNhom);
    const nguoiDuocGiao = duLieu.nguoiDuocGiao
      ? await this.layNguoiDuocGiaoHopLe(command.actorId, duLieu.maNhom, duLieu.nguoiDuocGiao)
      : null;

    try {
      const congViec = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const congViecMoi = await this.deps.khoKanban.taoCongViec(
          {
            maNhom: duLieu.maNhom,
            tieuDe: duLieu.tieuDe,
            moTa: duLieu.moTa,
            hanHoanThanh: duLieu.hanHoanThanh,
            nguoiDuocGiao: duLieu.nguoiDuocGiao,
            trangThai: "CHUA_BAT_DAU"
          },
          tx
        );

        if (nguoiDuocGiao) {
          await this.deps.khoKanban.taoThongBaoNhieu(
            {
              actorId: command.actorId,
              nguoiNhanIds: [nguoiDuocGiao.maNguoiDung],
              tieuDe: "Bạn được phân công công việc mới",
              noiDung: `Bạn được phân công công việc "${congViecMoi.tieuDe}" trong nhóm học tập.`,
              maCongViec: congViecMoi.maCongViec
            },
            tx
          );
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "KANBAN_TASK_CREATED",
            tableName: "cong_viec_nhom",
            recordId: congViecMoi.maCongViec,
            message: "Sinh viên tạo mới thẻ công việc Kanban",
            metadata: {
              maNhom: duLieu.maNhom,
              maCongViec: congViecMoi.maCongViec,
              tieuDe: duLieu.tieuDe,
              nguoiDuocGiao: duLieu.nguoiDuocGiao,
              vaiTroNguoiTao: thanhVien.vaiTroTrongNhom
            }
          },
          tx
        );

        return congViecMoi;
      });

      return {
        message: "Thêm công việc vào bảng nhóm thành công!",
        congViec
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiKanban.ghi({
        actorId: command.actorId,
        action: "KANBAN_TASK_CREATE_FAILED",
        tableName: "cong_viec_nhom",
        message: "Lỗi lưu thông tin công việc Kanban vào cơ sở dữ liệu",
        error,
        metadata: {
          maNhom: duLieu.maNhom,
          tieuDe: duLieu.tieuDe,
          nguoiDuocGiao: duLieu.nguoiDuocGiao
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể thêm công việc lúc này");
    }
  }

  private async chuanHoaVaKiemTra(command: LenhTaoCongViecKanban): Promise<DuLieuHopLe> {
    const maNhom = command.maNhom?.trim() ?? "";
    const tieuDe = chuanHoaChuoi(command.tieuDe);
    const moTa = chuanHoaMoTa(command.moTa);
    const hanHoanThanh = docNgayTuyChon(command.hanHoanThanh);
    const nguoiDuocGiao = command.nguoiDuocGiao?.trim() ? assertUuid(command.nguoiDuocGiao, "Mã người phụ trách không hợp lệ") : null;
    const loi: string[] = [];

    if (!tieuDe) {
      loi.push("Tiêu đề công việc không được để trống");
    }

    if (!maNhom || !laUuid(maNhom)) {
      loi.push("Bạn cần tạo hoặc chọn nhóm học tập theo môn học trước khi tạo công việc");
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
        action: "KANBAN_TASK_CREATE_VALIDATION_FAILED",
        tableName: "cong_viec_nhom",
        recordId: maNhom,
        message: "Yêu cầu thêm công việc Kanban thất bại do dữ liệu đầu vào không hợp lệ",
        metadata: {
          maNhom,
          errors: loi
        }
      });
      throw LoiUngDung.yeuCauSai("Dữ liệu nhập không hợp lệ. Vui lòng kiểm tra lại!", loi);
    }

    return {
      maNhom,
      tieuDe,
      moTa,
      hanHoanThanh,
      nguoiDuocGiao
    };
  }

  private async layVaKiemTraQuyenTao(actorId: string, maNhom: string) {
    const [nhom, thanhVien] = await Promise.all([
      this.deps.khoKanban.timNhom(maNhom),
      this.deps.khoKanban.timThanhVien(maNhom, actorId)
    ]);

    if (!nhom || !thanhVien || !laTruongNhom(thanhVien)) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId,
        action: "KANBAN_TASK_CREATE_DENIED",
        tableName: "cong_viec_nhom",
        recordId: maNhom,
        message: "Sinh viên tạo công việc Kanban thất bại vì không có quyền trong nhóm",
        metadata: {
          maNhom,
          groupExists: Boolean(nhom),
          role: thanhVien?.vaiTroTrongNhom ?? null,
          ruleCode: "BR-KANBAN-01"
        }
      });
      throw LoiUngDung.khongCoQuyen("Tài khoản bị khóa hoặc bạn không có quyền thao tác trong nhóm này!");
    }

    return thanhVien;
  }

  private async layNguoiDuocGiaoHopLe(actorId: string, maNhom: string, maNguoiDuocGiao: string): Promise<NguoiThamGiaKanban> {
    const thanhVien = await this.deps.khoKanban.timThanhVien(maNhom, maNguoiDuocGiao);

    if (!thanhVien) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId,
        action: "KANBAN_TASK_CREATE_ASSIGNEE_INVALID",
        tableName: "thanh_vien_nhom",
        recordId: maNhom,
        message: "Sinh viên tạo công việc Kanban thất bại vì người phụ trách không còn trong nhóm",
        metadata: {
          maNhom,
          maNguoiDuocGiao,
          ruleCode: "BR-KANBAN-GROUP-ISOLATION"
        }
      });
      throw LoiUngDung.yeuCauSai("Người phụ trách không tồn tại hoặc đã rời khỏi nhóm!");
    }

    return thanhVien;
  }
}
