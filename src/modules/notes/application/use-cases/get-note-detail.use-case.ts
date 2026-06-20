import type { DichVuQuyenGhiChu } from "../services/note-access.service.js";

type PhuThuoc = {
  dichVuQuyenGhiChu: DichVuQuyenGhiChu;
};

export class XuLyLayChiTietGhiChu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(actorId: string, maGhiChu: string) {
    return this.deps.dichVuQuyenGhiChu.layGhiChuThuocSinhVien(actorId, maGhiChu, "xem");
  }
}
