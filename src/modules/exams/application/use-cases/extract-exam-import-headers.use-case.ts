import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { BoDocTepImportLichThi, TepImportLichThi } from "../ports/exam-import-parser.js";

export type LenhTrichXuatHeaderImportLichThi = TepImportLichThi & {
  actorId: string;
};

export class XuLyTrichXuatHeaderImportLichThi {
  constructor(private readonly deps: { boDocTepImportLichThi: BoDocTepImportLichThi }) {}

  async thucThi(command: LenhTrichXuatHeaderImportLichThi) {
    try {
      const ketQua = await this.deps.boDocTepImportLichThi.doc({
        buffer: command.buffer,
        tenFile: command.tenFile,
        mimeType: command.mimeType
      });

      return {
        message: "Trích xuất header lịch thi thành công",
        ...ketQua
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể đọc file lịch thi lúc này");
    }
  }
}
