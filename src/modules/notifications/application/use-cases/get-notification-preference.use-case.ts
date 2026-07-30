import type { KhoTuyChinhThongBaoDay } from "../ports/notification-preference.repository.js";

export type LenhLayTuyChinhThongBaoDay = {
  actorId: string;
};

type PhuThuoc = {
  khoTuyChinhThongBaoDay: KhoTuyChinhThongBaoDay;
};

export class XuLyLayTuyChinhThongBaoDay {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhLayTuyChinhThongBaoDay) {
    const nhanThongBao = await this.deps.khoTuyChinhThongBaoDay.layTheoNguoiDung(command.actorId);

    return {
      message: "Lấy tùy chọn nhận thông báo thành công",
      nhanThongBao
    };
  }
}
