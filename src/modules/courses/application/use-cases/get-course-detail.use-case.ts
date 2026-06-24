import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoHocPhan } from "../ports/course.repository.js";

export type LenhChiTietHocPhan = {
  actorId: string;
  maMonHoc: string;
};

type PhuThuoc = {
  khoHocPhan: KhoHocPhan;
};

export class XuLyChiTietHocPhan {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhChiTietHocPhan) {
    const monHoc = await this.deps.khoHocPhan.timTheoMaCuaSinhVien(command.maMonHoc, command.actorId);

    if (!monHoc) {
      throw LoiUngDung.khongTimThay("Không tìm thấy môn học");
    }

    return {
      message: "Lấy chi tiết môn học thành công",
      monHoc
    };
  }
}
