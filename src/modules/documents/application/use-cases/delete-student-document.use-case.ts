import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoTaiLieu } from "../ports/document.repository.js";

export type LenhXoaTaiLieuSinhVien = {
  actorId: string;
  maTaiLieu: string;
};

type PhuThuoc = {
  khoTaiLieu: KhoTaiLieu;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyXoaTaiLieuSinhVien {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXoaTaiLieuSinhVien) {
    const taiLieu = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      const daXoa = await this.deps.khoTaiLieu.danhDauXoaCuaSinhVien(
        command.maTaiLieu,
        command.actorId,
        tx
      );

      if (!daXoa) {
        throw LoiUngDung.khongTimThay("Không tìm thấy tài liệu của bạn để xóa");
      }

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId,
          level: "INFO",
          action: "DOCUMENT_SOFT_DELETED",
          tableName: "tai_lieu",
          recordId: daXoa.maTaiLieu,
          message: "Sinh viên xóa mềm tài liệu khỏi màn lưu trữ",
          metadata: {
            tenFile: daXoa.tenFile,
            loaiFile: daXoa.loaiFile,
            dungLuong: daXoa.dungLuong
          }
        },
        tx
      );

      return daXoa;
    });

    return {
      message: "Đã xóa tài liệu khỏi lưu trữ",
      taiLieu
    };
  }
}
