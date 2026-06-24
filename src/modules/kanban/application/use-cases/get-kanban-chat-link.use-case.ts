import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoKanban } from "../ports/kanban.repository.js";
import type { DichVuGhiLogLoiKanban } from "../services/kanban-error-logger.service.js";
import { assertUuid } from "./kanban-use-case.helpers.js";

export type LenhLayLienKetNhomChatKanban = {
  actorId: string;
  maNhom: string;
};

type PhuThuoc = {
  khoKanban: KhoKanban;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuGhiLogLoiKanban: DichVuGhiLogLoiKanban;
};

export class XuLyLayLienKetNhomChatKanban {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhLayLienKetNhomChatKanban) {
    const maNhom = assertUuid(command.maNhom, "Mã nhóm học tập không hợp lệ");

    try {
      const [nhom, thanhVien] = await Promise.all([
        this.deps.khoKanban.timNhom(maNhom),
        this.deps.khoKanban.timThanhVien(maNhom, command.actorId)
      ]);

      if (!nhom || !thanhVien) {
        await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
          actorId: command.actorId,
          action: "KANBAN_CHAT_LINK_ACCESS_DENIED",
          tableName: "nhom_hoc_tap",
          recordId: maNhom,
          message: "Sinh viên mở link nhóm chat thất bại vì không có quyền truy cập nhóm",
          metadata: {
            maNhom,
            groupExists: Boolean(nhom),
            membershipExists: Boolean(thanhVien)
          }
        });
        throw LoiUngDung.khongCoQuyen("Bạn không có quyền truy cập hoặc không còn là thành viên nhóm học tập này!");
      }

      const linkNhomChat = nhom.linkNhomChat?.trim() ?? "";

      if (!linkNhomChat) {
        await this.deps.dichVuGhiLogLoiKanban.ghiCanhBao({
          actorId: command.actorId,
          action: "KANBAN_CHAT_LINK_MISSING",
          tableName: "nhom_hoc_tap",
          recordId: maNhom,
          message: "Sinh viên mở link nhóm chat thất bại vì nhóm chưa cài đặt liên kết",
          metadata: {
            maNhom,
            role: thanhVien.vaiTroTrongNhom
          }
        });
        throw LoiUngDung.khongTheXuLy("Trưởng nhóm chưa cập nhật liên kết nhóm chat (Zalo/Discord/Messenger) cho nhóm này!");
      }

      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "INFO",
        action: "KANBAN_CHAT_LINK_OPENED",
        tableName: "nhom_hoc_tap",
        recordId: maNhom,
        message: "Sinh viên mở liên kết phòng chat nhóm học tập",
        metadata: {
          maNhom,
          role: thanhVien.vaiTroTrongNhom
        }
      });

      return {
        message: "Mở liên kết phòng chat thành công",
        maNhom,
        linkNhomChat,
        openMode: "EXTERNAL_APP_OR_WEB"
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiKanban.ghi({
        actorId: command.actorId,
        action: "KANBAN_CHAT_LINK_OPEN_FAILED",
        tableName: "nhom_hoc_tap",
        recordId: maNhom,
        message: "Lỗi lấy liên kết nhóm chat Kanban",
        error,
        metadata: { maNhom }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể mở liên kết nhóm chat lúc này");
    }
  }
}
