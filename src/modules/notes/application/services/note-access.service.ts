import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { GhiChuChiTiet } from "../../domain/notes.js";
import type { KhoGhiChu } from "../ports/note.repository.js";

type PhuThuoc = {
  khoGhiChu: KhoGhiChu;
  khoNhatKyHeThong: KhoNhatKyHeThong;
};

export class DichVuQuyenGhiChu {
  constructor(private readonly deps: PhuThuoc) {}

  async layGhiChuThuocSinhVien(actorId: string, maGhiChu: string, hanhDong: string): Promise<GhiChuChiTiet> {
    const ghiChu = await this.deps.khoGhiChu.timTheoMa(maGhiChu);

    if (!ghiChu) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId,
        level: "WARNING",
        action: "NOTE_NOT_FOUND",
        tableName: "ghi_chu",
        recordId: maGhiChu,
        message: "Sinh vien thao tac ghi chu that bai vi khong tim thay ghi chu",
        metadata: {
          maGhiChu,
          hanhDong
        }
      });
      throw LoiUngDung.khongTimThay("Không tìm thấy ghi chú");
    }

    if (ghiChu.maNguoiDung !== actorId) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId,
        level: "WARNING",
        action: "NOTE_ACCESS_DENIED",
        tableName: "ghi_chu",
        recordId: maGhiChu,
        message: `Sinh viên không có quyền ${hanhDong} ghi chú`,
        metadata: {
          maGhiChu,
          ownerId: ghiChu.maNguoiDung
        }
      });

      const thongBao = hanhDong === "xóa"
        ? "Bạn không có quyền xóa ghi chú này!"
        : `Bạn không có quyền ${hanhDong} ghi chú này`;
      throw LoiUngDung.khongCoQuyen(thongBao);
    }

    return ghiChu;
  }

  async kiemTraMonHocNeuCo(maMonHoc: string | null, actorId: string, thongBao: string) {
    if (!maMonHoc) {
      return;
    }

    const hopLe = await this.deps.khoGhiChu.kiemTraMonHocThuocSinhVien(maMonHoc, actorId);

    if (!hopLe) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId,
        level: "WARNING",
        action: "NOTE_COURSE_ACCESS_DENIED",
        tableName: "mon_hoc",
        recordId: maMonHoc,
        message: "Sinh vien thao tac ghi chu that bai vi mon hoc khong thuoc sinh vien",
        metadata: {
          maMonHoc
        }
      });
      throw LoiUngDung.khongCoQuyen(thongBao);
    }
  }
}
