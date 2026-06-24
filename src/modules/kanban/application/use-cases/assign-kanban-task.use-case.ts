import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { CongViecKanban, NguoiThamGiaKanban } from "../../domain/kanban.js";
import type { KhoKanban } from "../ports/kanban.repository.js";
import type { DichVuGhiLogLoiKanban } from "../services/kanban-error-logger.service.js";
import { assertUuid, laTruongNhom } from "./kanban-use-case.helpers.js";

export type LenhPhanCongCongViecKanban = {
  actorId: string;
  maCongViec: string;
  nguoiDuocGiao?: string | null;
};

type PhuThuoc = {
  khoKanban: KhoKanban;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiKanban: DichVuGhiLogLoiKanban;
};

export class XuLyPhanCongCongViecKanban {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhPhanCongCongViecKanban) {
    const maCongViec = assertUuid(command.maCongViec, "Mã công việc không hợp lệ");
    const nguoiDuocGiao = command.nguoiDuocGiao?.trim()
      ? assertUuid(command.nguoiDuocGiao, "Mã người thực hiện không hợp lệ")
      : null;
    const congViec = await this.layCongViec(command.actorId, maCongViec);
    await this.kiemTraQuyenPhanCong(command.actorId, congViec);
    const thanhVienDuocGiao = nguoiDuocGiao
      ? await this.layThanhVienDuocGiao(command.actorId, congViec.maNhom, nguoiDuocGiao)
      : null;

    try {
      const congViecDaCapNhat = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const capNhat = await this.deps.khoKanban.capNhatNguoiDuocGiao(maCongViec, nguoiDuocGiao, tx);

        if (!capNhat) {
          throw LoiUngDung.khongTimThay("Công việc không tồn tại hoặc đã bị xóa bởi thành viên khác!");
        }

        if (thanhVienDuocGiao) {
          await this.deps.khoKanban.taoThongBaoNhieu(
            {
              actorId: command.actorId,
              nguoiNhanIds: [thanhVienDuocGiao.maNguoiDung],
              tieuDe: "Bạn được phân công công việc",
              noiDung: `Bạn được phân công công việc "${congViec.tieuDe}" trong nhóm học tập.`,
              maCongViec
            },
            tx
          );
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "KANBAN_TASK_ASSIGNED",
            tableName: "cong_viec_nhom",
            recordId: maCongViec,
            message: "Sinh viên phân công thành viên thực hiện công việc Kanban",
            metadata: {
              maNhom: congViec.maNhom,
              maCongViec,
              nguoiDuocGiaoCu: congViec.nguoiDuocGiao,
              nguoiDuocGiaoMoi: nguoiDuocGiao
            }
          },
          tx
        );

        return capNhat;
      });

      return {
        message: "Phân công người thực hiện công việc thành công!",
        congViec: congViecDaCapNhat
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiKanban.ghi({
        actorId: command.actorId,
        action: "KANBAN_TASK_ASSIGN_FAILED",
        tableName: "cong_viec_nhom",
        recordId: maCongViec,
        message: "Lỗi phân công công việc Kanban vào cơ sở dữ liệu",
        error,
        metadata: {
          maNhom: congViec.maNhom,
          maCongViec,
          nguoiDuocGiao
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể phân công công việc lúc này");
    }
  }

  private async layCongViec(actorId: string, maCongViec: string) {
    const congViec = await this.deps.khoKanban.timCongViec(maCongViec);

    if (!congViec) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId,
        action: "KANBAN_TASK_ASSIGN_NOT_FOUND",
        tableName: "cong_viec_nhom",
        recordId: maCongViec,
        message: "Sinh viên phân công công việc Kanban thất bại vì công việc không tồn tại",
        metadata: { maCongViec }
      });
      throw LoiUngDung.khongTimThay("Công việc không tồn tại hoặc đã bị xóa bởi thành viên khác!");
    }

    return congViec;
  }

  private async kiemTraQuyenPhanCong(actorId: string, congViec: CongViecKanban) {
    const thanhVien = await this.deps.khoKanban.timThanhVien(congViec.maNhom, actorId);

    if (!laTruongNhom(thanhVien)) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId,
        action: "KANBAN_TASK_ASSIGN_DENIED",
        tableName: "cong_viec_nhom",
        recordId: congViec.maCongViec,
        message: "Sinh viên phân công công việc Kanban thất bại vì không có quyền trong nhóm",
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

  private async layThanhVienDuocGiao(actorId: string, maNhom: string, nguoiDuocGiao: string): Promise<NguoiThamGiaKanban> {
    const thanhVien = await this.deps.khoKanban.timThanhVien(maNhom, nguoiDuocGiao);

    if (!thanhVien) {
      await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
        actorId,
        action: "KANBAN_TASK_ASSIGN_MEMBER_INVALID",
        tableName: "thanh_vien_nhom",
        recordId: maNhom,
        message: "Sinh viên phân công công việc Kanban thất bại vì thành viên được chọn không hợp lệ",
        metadata: {
          maNhom,
          nguoiDuocGiao,
          ruleCode: "BR-KANBAN-GROUP-ISOLATION"
        }
      });
      throw LoiUngDung.yeuCauSai("Thành viên được chọn không tồn tại hoặc đã rời khỏi nhóm!");
    }

    return thanhVien;
  }
}
