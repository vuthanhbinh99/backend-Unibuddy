import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoThongBaoNguoiDung } from "../ports/user-notification.repository.js";

export type LenhDanhDauDaDocThongBao = {
  userId: string;
  maThongBao: string;
};

type PhuThuoc = {
  khoThongBaoNguoiDung: KhoThongBaoNguoiDung;
  khoNhatKyHeThong: KhoNhatKyHeThong;
};

export class XuLyDanhDauDaDocThongBao {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDanhDauDaDocThongBao) {
    const updated = await this.deps.khoThongBaoNguoiDung.danhDauDaDoc(
      command.userId,
      command.maThongBao
    );

    if (updated) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.userId,
        level: "INFO",
        action: "USER_NOTIFICATION_READ",
        tableName: "thong_bao",
        recordId: command.maThongBao,
        message: "Ngươi dùng đánh dấu thông báo là đã đọc",
      });
    }

    return {
      message: updated
        ? "Đã đánh dấu đọc thông báo"
        : "Thông báo đã được xử lý hoặc chưa hỗ trợ trạng thái đã đọc",
      updated
    };
  }
}
