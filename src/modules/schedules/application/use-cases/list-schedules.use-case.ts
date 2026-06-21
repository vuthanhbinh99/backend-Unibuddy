import type { KhoLichHoc } from "../ports/schedule.repository.js";

export type LenhDanhSachLichHoc = {
  actorId: string;
  maMonHoc?: string;
};

type PhuThuoc = {
  khoLichHoc: KhoLichHoc;
};

export class XuLyDanhSachLichHoc {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDanhSachLichHoc) {
    const items = await this.deps.khoLichHoc.lietKeTheoSinhVien(command.actorId, {
      maMonHoc: command.maMonHoc
    });

    return {
      message: items.length === 0 ? "Chưa có dữ liệu lịch học" : "Lấy thời khóa biểu thành công",
      items
    };
  }
}
