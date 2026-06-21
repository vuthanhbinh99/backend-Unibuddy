import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { BoDocTepImportThoiKhoaBieu, TepImportThoiKhoaBieu } from "../ports/schedule-import-parser.js";
import type { DichVuGhiLogLoiThoiKhoaBieu } from "../services/schedule-error-logger.service.js";

export type LenhTrichXuatHeaderImportThoiKhoaBieu = TepImportThoiKhoaBieu & {
  actorId: string;
};

type PhuThuoc = {
  boDocTepImportThoiKhoaBieu: BoDocTepImportThoiKhoaBieu;
  dichVuGhiLogLoiThoiKhoaBieu: DichVuGhiLogLoiThoiKhoaBieu;
};

export class XuLyTrichXuatHeaderImportThoiKhoaBieu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTrichXuatHeaderImportThoiKhoaBieu) {
    try {
      const ketQua = await this.deps.boDocTepImportThoiKhoaBieu.doc({
        buffer: command.buffer,
        tenFile: command.tenFile,
        mimeType: command.mimeType
      });

      return {
        message: "Trích xuất header thời khóa biểu thành công",
        ...ketQua
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghi({
        actorId: command.actorId,
        action: "SCHEDULE_IMPORT_HEADER_FAILED",
        message: "Lỗi trích xuất header file thời khóa biểu",
        error,
        metadata: {
          tenFile: command.tenFile,
          mimeType: command.mimeType
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể đọc file thời khóa biểu lúc này");
    }
  }
}
