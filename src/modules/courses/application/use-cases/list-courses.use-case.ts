import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoHocPhan } from "../ports/course.repository.js";

export type LenhDanhSachHocPhan = {
  actorId: string;
  maHocKy?: string | null;
};

type PhuThuoc = {
  khoHocPhan: KhoHocPhan;
};

export class XuLyDanhSachHocPhan {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDanhSachHocPhan) {
    const hocKy = await this.deps.khoHocPhan.lietKeHocKy(command.actorId);

    if (hocKy.length === 0) {
      return {
        message: "Chưa có dữ liệu học kỳ",
        hocKy,
        selectedMaHocKy: null,
        items: []
      };
    }

    const hocKyDuocChon = command.maHocKy
      ? await this.deps.khoHocPhan.timHocKyCuaSinhVien(command.maHocKy, command.actorId)
      : hocKy[0];

    if (!hocKyDuocChon) {
      throw LoiUngDung.khongTimThay("Không tìm thấy học kỳ của sinh viên");
    }

    const items = await this.deps.khoHocPhan.lietKeTheoHocKy(command.actorId, {
      maHocKy: hocKyDuocChon.maHocKy
    });

    return {
      message:
        items.length === 0
          ? "Học kỳ này chưa có môn học nào, bấm vào dấu (+) để thêm môn"
          : "Lấy danh sách môn học thành công",
      hocKy,
      selectedMaHocKy: hocKyDuocChon.maHocKy,
      items
    };
  }
}
