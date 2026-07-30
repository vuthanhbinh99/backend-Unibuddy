import type { KhoLichThi } from "../ports/exam.repository.js";

export type LenhDanhSachLichThi = {
  actorId: string;
  maMonHoc?: string;
};

export class XuLyDanhSachLichThi {
  constructor(private readonly deps: { khoLichThi: KhoLichThi }) {}

  async thucThi(command: LenhDanhSachLichThi) {
    const items = await this.deps.khoLichThi.lietKeTheoSinhVien(command.actorId, {
      maMonHoc: command.maMonHoc
    });

    return {
      message: items.length === 0 ? "Chưa có lịch thi" : "Lấy danh sách lịch thi thành công",
      items
    };
  }
}
