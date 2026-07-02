import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoNhomHocTap } from "../ports/study-group.repository.js";
import type { DichVuGhiLogLoiNhomHocTap } from "../services/study-group-error-logger.service.js";

export type LenhDanhSachNhomHocTap = {
  actorId: string;
};

type PhuThuoc = {
  khoNhomHocTap: KhoNhomHocTap;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuGhiLogLoiNhomHocTap: DichVuGhiLogLoiNhomHocTap;
};

export class XuLyDanhSachNhomHocTap {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDanhSachNhomHocTap) {
    try {
      const items = await this.deps.khoNhomHocTap.lietKeTheoThanhVien(command.actorId);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "INFO",
        action: "STUDY_GROUP_LIST_VIEWED",
        tableName: "nhom_hoc_tap",
        message: items.length > 0 ? "Sinh viên xem danh sách nhóm học tập" : "Sinh viên xem danh sách nhóm học tập trống",
        metadata: {
          total: items.length,
          soNhomTruongNhom: items.filter((item) => item.vaiTroTrongNhom === "TRUONG_NHOM").length
        }
      });

      return {
        message: items.length > 0 ? "Tải danh sách nhóm học tập thành công" : "Bạn chưa tham gia nhóm học tập nào",
        items
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiNhomHocTap.ghi({
        actorId: command.actorId,
        action: "STUDY_GROUP_LIST_FAILED",
        tableName: "nhom_hoc_tap",
        message: "Lỗi tải danh sách nhóm học tập",
        error,
        metadata: {}
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể tải danh sách nhóm học tập lúc này");
    }
  }
}
