import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoGhiChu } from "../ports/note.repository.js";
import type { LenhDanhSachGhiChu } from "./note-use-case.types.js";

type PhuThuoc = {
  khoGhiChu: KhoGhiChu;
  khoNhatKyHeThong: KhoNhatKyHeThong;
};

export class XuLyDanhSachGhiChu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDanhSachGhiChu) {
    const ketQua = await this.deps.khoGhiChu.lietKe({
      maNguoiDung: command.actorId,
      tuKhoa: command.tuKhoa,
      maMonHoc: command.maMonHoc,
      sort: command.sort,
      page: command.page,
      limit: command.limit
    });

    const laTraCuu = Boolean(command.tuKhoa || command.maMonHoc || command.sort !== "updated_desc");

    await this.deps.khoNhatKyHeThong.tao({
      actorId: command.actorId,
      level: "INFO",
      action: laTraCuu ? "NOTE_SEARCH_FILTERED" : "NOTE_LIST_VIEWED",
      tableName: "ghi_chu",
      message: laTraCuu ? "Sinh viên tìm kiếm và lọc ghi chú" : "Sinh viên xem danh sách ghi chú",
      metadata: {
        coTuKhoa: Boolean(command.tuKhoa),
        maMonHoc: command.maMonHoc ?? null,
        sort: command.sort,
        page: command.page,
        limit: command.limit,
        total: ketQua.total
      }
    });

    return {
      ...ketQua,
      message: ketQua.total === 0
        ? laTraCuu
          ? "Không tìm thấy ghi chú phù hợp"
          : "Bạn chưa có ghi chú nào"
        : undefined
    };
  }
}
