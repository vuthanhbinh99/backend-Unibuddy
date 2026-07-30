import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoThongBaoNguoiDung } from "../ports/user-notification.repository.js";

export type LenhAnThongBao = {
  userId: string;
  maThongBao: string;
};

type PhuThuoc = {
  khoThongBaoNguoiDung: KhoThongBaoNguoiDung;
  khoNhatKyHeThong: KhoNhatKyHeThong;
};

export class XuLyAnThongBao {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhAnThongBao) {
    const updated = await this.deps.khoThongBaoNguoiDung.anThongBao(
      command.userId,
      command.maThongBao
    );

    if (updated) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.userId,
        level: "INFO",
        action: "USER_NOTIFICATION_HIDDEN",
        tableName: "thong_bao",
        recordId: command.maThongBao,
        message: "Người dùng ẩn thông báo khỏi hộp thư",
      });
    }

    return {
      message: updated
        ? "Đã ẩn thông báo"
        : "Thông báo đã được xử lý hoặc không tìm thấy",
      updated
    };
  }
}
