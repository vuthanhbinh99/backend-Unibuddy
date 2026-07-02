import type { KhoThongBaoNguoiDung } from "../ports/user-notification.repository.js";
import type { LoaiThongBaoNguoiDung } from "../../domain/user-notification.js";

export type LenhDanhSachThongBaoNguoiDung = {
  userId: string;
  onlyUnread: boolean;
  loaiThongBao: LoaiThongBaoNguoiDung | null;
  page: number;
  limit: number;
};

type PhuThuoc = {
  khoThongBaoNguoiDung: KhoThongBaoNguoiDung;
};

export class XuLyDanhSachThongBaoNguoiDung {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDanhSachThongBaoNguoiDung) {
    return this.deps.khoThongBaoNguoiDung.lietKe(command);
  }
}
