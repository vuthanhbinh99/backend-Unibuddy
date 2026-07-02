import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoThongBaoNguoiDung } from "../ports/user-notification.repository.js";

export type LenhDanhDauTatCaDaDocThongBao = {
  userId: string;
};

type PhuThuoc = {
  khoThongBaoNguoiDung: KhoThongBaoNguoiDung;
  khoNhatKyHeThong: KhoNhatKyHeThong;
};

export class XuLyDanhDauTatCaDaDocThongBao {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDanhDauTatCaDaDocThongBao) {
    const updatedCount = await this.deps.khoThongBaoNguoiDung.danhDauTatCaDaDoc(command.userId);

    if (updatedCount > 0) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.userId,
        level: "INFO",
        action: "USER_NOTIFICATIONS_READ_ALL",
        tableName: "thong_bao",
        message: "Người dùng đánh dấu tất cả thông báo là đã đọc",
        metadata: { updatedCount }
      });
    }

    return {
      message: "Đã đánh dấu đọc tất cả thông báo",
      updatedCount
    };
  }
}
