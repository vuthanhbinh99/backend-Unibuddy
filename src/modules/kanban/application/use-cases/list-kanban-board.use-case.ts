import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import { CAC_TRANG_THAI_CONG_VIEC_KANBAN, type TrangThaiCongViecKanban } from "../../domain/kanban.js";
import type { KhoKanban } from "../ports/kanban.repository.js";
import type { DichVuGhiLogLoiKanban } from "../services/kanban-error-logger.service.js";
import { assertUuid, taoThongTinBaoHiemUx } from "./kanban-use-case.helpers.js";

export type LenhXemBangKanban = {
  actorId: string;
  maNhom: string;
};

type PhuThuoc = {
  khoKanban: KhoKanban;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiKanban: DichVuGhiLogLoiKanban;
};

const TIEU_DE_COT: Record<TrangThaiCongViecKanban, string> = {
  CHUA_BAT_DAU: "Chưa bắt đầu",
  DANG_THUC_HIEN: "Đang thực hiện",
  HOAN_THANH: "Hoàn thành",
  TRE_HAN: "Trễ hạn"
};

export class XuLyXemBangKanban {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXemBangKanban) {
    const maNhom = assertUuid(command.maNhom, "Mã nhóm học tập không hợp lệ");

    try {
      const nhom = await this.deps.khoKanban.timNhom(maNhom);

      if (!nhom) {
        await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
          actorId: command.actorId,
          action: "KANBAN_BOARD_GROUP_NOT_FOUND",
          tableName: "nhom_hoc_tap",
          recordId: maNhom,
          message: "Sinh viên xem bảng Kanban thất bại vì nhóm học tập không tồn tại",
          metadata: { maNhom }
        });
        throw LoiUngDung.khongTimThay("Không tìm thấy nhóm học tập yêu cầu");
      }

      const thanhVien = await this.deps.khoKanban.timThanhVien(maNhom, command.actorId);

      if (!thanhVien) {
        await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
          actorId: command.actorId,
          action: "KANBAN_BOARD_ACCESS_DENIED",
          tableName: "thanh_vien_nhom",
          recordId: maNhom,
          message: "Sinh viên xem bảng Kanban thất bại vì không còn là thành viên nhóm",
          metadata: { maNhom }
        });
        throw LoiUngDung.khongCoQuyen("Bạn không có quyền truy cập hoặc không còn là thành viên nhóm này");
      }

      const soCongViecChuyenTreHan = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const soLuong = await this.deps.khoKanban.capNhatCongViecTreHanTheoNhom(maNhom, tx);

        if (soLuong > 0) {
          await this.deps.khoNhatKyHeThong.tao(
            {
              actorId: command.actorId,
              level: "INFO",
              action: "KANBAN_TASKS_MARKED_OVERDUE",
              tableName: "cong_viec_nhom",
              recordId: maNhom,
              message: "Hệ thống tự động chuyển công việc quá hạn sang trạng thái Trễ hạn",
              metadata: {
                maNhom,
                soLuong
              }
            },
            tx
          );
        }

        return soLuong;
      });

      const [items, thanhVienNhom, coHoTroViTri] = await Promise.all([
        this.deps.khoKanban.lietKeCongViecTheoNhom(maNhom),
        this.deps.khoKanban.lietKeThanhVien(maNhom),
        this.deps.khoKanban.coHoTroViTriCongViec()
      ]);

      const cot = CAC_TRANG_THAI_CONG_VIEC_KANBAN.map((trangThai) => ({
        trangThai,
        tieuDe: TIEU_DE_COT[trangThai],
        items: items.filter((item) => item.trangThai === trangThai)
      }));

      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "INFO",
        action: "KANBAN_BOARD_VIEWED",
        tableName: "cong_viec_nhom",
        recordId: maNhom,
        message: items.length > 0 ? "Sinh viên xem bảng Kanban nhóm học tập" : "Sinh viên xem bảng Kanban nhóm học tập trống",
        metadata: {
          maNhom,
          total: items.length,
          soThanhVien: thanhVienNhom.length,
          soCongViecChuyenTreHan,
          coHoTroViTri
        }
      });

      return {
        message: items.length > 0 ? "Tải bảng công việc Kanban thành công" : "Nhóm học tập chưa có công việc nào",
        nhom,
        vaiTroCuaToi: thanhVien.vaiTroTrongNhom,
        thanhVien: thanhVienNhom,
        total: items.length,
        positionPersistence: coHoTroViTri,
        uxFallback: taoThongTinBaoHiemUx(),
        columns: cot
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiKanban.ghi({
        actorId: command.actorId,
        action: "KANBAN_BOARD_LOAD_FAILED",
        tableName: "cong_viec_nhom",
        recordId: maNhom,
        message: "Lỗi tải bảng Kanban nhóm học tập",
        error,
        metadata: { maNhom }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể tải bảng công việc lúc này");
    }
  }
}
