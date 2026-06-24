import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DichVuQuyenGhiChu } from "../services/note-access.service.js";
import type { DichVuTepDinhKemGhiChu } from "../services/note-attachment.service.js";
import type { DichVuGhiLogLoiGhiChu } from "../services/note-error-logger.service.js";
import type { LenhDinhKemTaiLieuGhiChu } from "./note-use-case.types.js";

type PhuThuoc = {
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuQuyenGhiChu: DichVuQuyenGhiChu;
  dichVuTepDinhKemGhiChu: DichVuTepDinhKemGhiChu;
  dichVuGhiLogLoiGhiChu: DichVuGhiLogLoiGhiChu;
};

export class XuLyDinhKemTaiLieuGhiChu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDinhKemTaiLieuGhiChu) {
    await this.deps.dichVuQuyenGhiChu.layGhiChuThuocSinhVien(
      command.actorId,
      command.maGhiChu,
      "đính kèm tài liệu vào"
    );
    await this.deps.dichVuTepDinhKemGhiChu.kiemTraTrungDuongDan([command], command.actorId, command.maGhiChu);

    try {
      const tepDinhKem = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const tep = await this.deps.dichVuTepDinhKemGhiChu.taoTepDinhKem(
          command,
          command.maGhiChu,
          command.actorId,
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "NOTE_ATTACHMENT_ADDED",
            tableName: "tai_lieu",
            recordId: tep.maTaiLieu,
            message: "Sinh viên đính kèm tài liệu vào ghi chú thành công",
            metadata: {
              maGhiChu: command.maGhiChu,
              maTaiLieu: tep.maTaiLieu,
              tenFile: command.tenFile,
              loaiFile: command.loaiFile,
              dungLuong: command.dungLuong,
              coDownloadUrl: true
            }
          },
          tx
        );

        return tep;
      });

      return {
        message: "Đính kèm tài liệu thành công",
        tepDinhKem
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiGhiChu.ghi({
        actorId: command.actorId,
        action: "NOTE_ATTACHMENT_CREATE_FAILED",
        tableName: "tai_lieu",
        recordId: command.maGhiChu,
        message: "Lỗi lưu thông tin tài liệu đính kèm ghi chú vào database",
        error,
        metadata: {
          maGhiChu: command.maGhiChu,
          tenFile: command.tenFile,
          loaiFile: command.loaiFile,
          dungLuong: command.dungLuong
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể đính kèm tài liệu lúc này");
    }
  }
}
