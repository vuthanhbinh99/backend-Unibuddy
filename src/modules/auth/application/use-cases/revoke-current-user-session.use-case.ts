import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoPhienDangNhap } from "../ports/session.repository.js";

export type LenhThuHoiPhienDangNhap = {
  actorId: string;
  sessionId: string;
};

type PhuThuoc = {
  khoPhienDangNhap: KhoPhienDangNhap;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyThuHoiPhienDangNhapCuaToi {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhThuHoiPhienDangNhap): Promise<void> {
    await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      const daThuHoi = await this.deps.khoPhienDangNhap.thuHoiTheoMaPhien(
        command.sessionId,
        command.actorId,
        tx
      );

      if (!daThuHoi) {
        throw LoiUngDung.khongTimThay("Không tìm thấy phiên đăng nhập cần đăng xuất");
      }

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId,
          level: "INFO",
          action: "AUTH_SESSION_REVOKED",
          tableName: "phien_dang_nhap",
          recordId: command.sessionId,
          message: "Người dùng đã đăng xuất một thiết bị"
        },
        tx
      );
    });
  }
}