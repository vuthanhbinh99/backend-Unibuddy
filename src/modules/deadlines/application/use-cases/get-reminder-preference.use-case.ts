import type { KhoTuyChinhNhacNho } from "../ports/reminder-preference.repository.js";
import { CAC_MOC_NHAC_MAC_DINH_GIO } from "../services/deadline-reminder.service.js";

export type LenhLayTuyChinhNhacNho = {
  actorId: string;
};

type PhuThuoc = {
  khoTuyChinhNhacNho: KhoTuyChinhNhacNho;
};

export class XuLyLayTuyChinhNhacNho {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhLayTuyChinhNhacNho) {
    const soGioTruocHan = await this.deps.khoTuyChinhNhacNho.layTheoNguoiDung(command.actorId);

    return {
      message: "Lấy tùy chỉnh nhắc nhở deadline thành công",
      soGioTruocHan,
      mocMacDinh: [...CAC_MOC_NHAC_MAC_DINH_GIO]
    };
  }
}
