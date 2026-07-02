import type { KhoTaiLieu } from "../ports/document.repository.js";

export type LenhDanhSachTaiLieuSinhVien = {
  actorId: string;
  query?: string;
  page: number;
  limit: number;
};

type PhuThuoc = {
  khoTaiLieu: KhoTaiLieu;
};

const DUNG_LUONG_LUU_TRU_TOI_DA = 5 * 1024 * 1024 * 1024;

export class XuLyDanhSachTaiLieuSinhVien {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDanhSachTaiLieuSinhVien) {
    const page = Math.max(1, command.page);
    const limit = Math.min(Math.max(1, command.limit), 100);
    const offset = (page - 1) * limit;

    const ketQua = await this.deps.khoTaiLieu.lietKeChoSinhVien({
      maNguoiDung: command.actorId,
      query: command.query,
      limit,
      offset
    });

    return {
      message: "Lấy danh sách tài liệu lưu trữ thành công",
      items: ketQua.items,
      page,
      limit,
      total: ketQua.total,
      totalBytes: ketQua.totalBytes,
      storageMaxBytes: DUNG_LUONG_LUU_TRU_TOI_DA
    };
  }
}
