import * as XLSX from "xlsx";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import type {
  BoDocTepImportFlashcard,
  DongImportFlashcardDaParse,
  KetQuaDocTepImportFlashcard,
  TepImportFlashcard
} from "../application/ports/flashcard-import-parser.js";

const MIME_EXCEL = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

const MIME_CSV = new Set(["text/csv", "text/plain", "application/csv"]);

const HEADER_MAT_TRUOC = new Set(["CAU_HOI", "MAT_TRUOC", "QUESTION", "FRONT"]);
const HEADER_MAT_SAU = new Set(["DAP_AN", "CAU_TRA_LOI", "MAT_SAU", "ANSWER", "BACK"]);

const layPhanMoRong = (tenFile: string) => tenFile.toLowerCase().split(".").pop() ?? "";

const chuanHoaHeader = (header: string) =>
  header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const taoTenCotDocNhat = (headers: string[]) => {
  const dem = new Map<string, number>();

  return headers.map((header, index) => {
    const base = header.trim() || `Cot ${index + 1}`;
    const count = dem.get(base) ?? 0;
    dem.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
};

const timChiSoCot = (headers: string[], tapHeader: Set<string>) =>
  headers.findIndex((header) => tapHeader.has(chuanHoaHeader(header)));

const bangTuMangDong = (rows: unknown[][]): { headers: string[]; rows: DongImportFlashcardDaParse[] } => {
  const dongCoDuLieu = rows.filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""));

  if (dongCoDuLieu.length === 0) {
    throw LoiUngDung.yeuCauSai("File flashcard không có dữ liệu");
  }

  const headers = taoTenCotDocNhat((dongCoDuLieu[0] ?? []).map((cell) => String(cell ?? "").trim()));
  const chiSoMatTruoc = timChiSoCot(headers, HEADER_MAT_TRUOC);
  const chiSoMatSau = timChiSoCot(headers, HEADER_MAT_SAU);

  if (chiSoMatTruoc < 0 || chiSoMatSau < 0) {
    throw LoiUngDung.yeuCauSai(
      "Cấu trúc file mẫu không hợp lệ. Vui lòng giữ nguyên dòng tiêu đề CAU_HOI và DAP_AN"
    );
  }

  const duLieu = dongCoDuLieu.slice(1).map((row, index) => ({
    rowIndex: index + 2,
    matTruoc: String(row[chiSoMatTruoc] ?? "").trim(),
    matSau: String(row[chiSoMatSau] ?? "").trim()
  }));

  return { headers, rows: duLieu };
};

export class BoDocTepImportFlashcardXlsxCsv implements BoDocTepImportFlashcard {
  doc(tep: TepImportFlashcard): KetQuaDocTepImportFlashcard {
    const extension = layPhanMoRong(tep.tenFile);

    if (MIME_EXCEL.has(tep.mimeType) || extension === "xlsx" || extension === "xls") {
      const { headers, rows } = this.docBangTinh(tep.buffer);
      return { headers, rows, sourceType: "EXCEL" };
    }

    if (MIME_CSV.has(tep.mimeType) || extension === "csv") {
      const { headers, rows } = this.docBangTinh(tep.buffer);
      return { headers, rows, sourceType: "CSV" };
    }

    throw LoiUngDung.yeuCauSai("Định dạng file không hỗ trợ. Vui lòng sử dụng file Excel theo mẫu.");
  }

  private docBangTinh(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false, raw: false });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw LoiUngDung.yeuCauSai("File flashcard không có sheet dữ liệu");
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: null,
      raw: false
    });

    return bangTuMangDong(rawRows);
  }
}
