import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import type {
  BoTrichXuatVanBanTaiLieu,
  KetQuaTrichXuatVanBan,
  TepTaiLieuFlashcard
} from "../application/ports/document-text-extractor.js";

const MIME_PDF = new Set(["application/pdf"]);
const MIME_DOCX = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);
const MIME_TXT = new Set(["text/plain", "text/markdown", "application/octet-stream"]);

const layPhanMoRong = (tenFile: string) => tenFile.toLowerCase().split(".").pop() ?? "";

const chuanHoaVanBan = (text: string) =>
  text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export class BoTrichXuatVanBanTaiLieuMacDinh implements BoTrichXuatVanBanTaiLieu {
  async trichXuat(tep: TepTaiLieuFlashcard): Promise<KetQuaTrichXuatVanBan> {
    const extension = layPhanMoRong(tep.tenFile);

    if (MIME_PDF.has(tep.mimeType) || extension === "pdf") {
      return { text: await this.docPdf(tep.buffer), sourceType: "PDF" };
    }

    if (MIME_DOCX.has(tep.mimeType) || extension === "docx") {
      return { text: await this.docDocx(tep.buffer), sourceType: "DOCX" };
    }

    if (MIME_TXT.has(tep.mimeType) || extension === "txt" || extension === "md") {
      return { text: chuanHoaVanBan(tep.buffer.toString("utf8")), sourceType: "TXT" };
    }

    throw LoiUngDung.yeuCauSai("Định dạng file không hỗ trợ. Vui lòng dùng PDF, DOCX hoặc TXT.");
  }

  private async docPdf(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });

    try {
      const parsed = await parser.getText();
      return chuanHoaVanBan(parsed.text ?? "");
    } catch {
      throw LoiUngDung.yeuCauSai("Không thể đọc nội dung file PDF, vui lòng thử lại với file khác.");
    }
  }

  private async docDocx(buffer: Buffer): Promise<string> {
    try {
      const ketQua = await mammoth.extractRawText({ buffer });
      return chuanHoaVanBan(ketQua.value ?? "");
    } catch {
      throw LoiUngDung.yeuCauSai("Không thể đọc nội dung file DOCX, vui lòng thử lại với file khác.");
    }
  }
}
