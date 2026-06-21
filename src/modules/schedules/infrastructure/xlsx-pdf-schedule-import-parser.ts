import { PDFParse } from "pdf-parse";
import * as XLSX from "xlsx";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import type {
  BoDocTepImportThoiKhoaBieu,
  KetQuaDocTepImportThoiKhoaBieu,
  TepImportThoiKhoaBieu
} from "../application/ports/schedule-import-parser.js";
import { goiYMappingCotImportThoiKhoaBieu } from "../application/services/schedule-import-mapper.service.js";
import type { DongImportThoiKhoaBieu } from "../domain/schedule.js";

const MIME_EXCEL = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

const MIME_PDF = "application/pdf";
const MIME_CSV = new Set(["text/csv", "text/plain", "application/csv"]);

const layPhanMoRong = (tenFile: string) => tenFile.toLowerCase().split(".").pop() ?? "";

const taoTenCotDocNhat = (headers: string[]) => {
  const dem = new Map<string, number>();

  return headers.map((header, index) => {
    const base = header.trim() || `Cot ${index + 1}`;
    const count = dem.get(base) ?? 0;
    dem.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
};

const bangTuMangDong = (rows: unknown[][]) => {
  const dongCoDuLieu = rows.filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""));
  const headers = taoTenCotDocNhat((dongCoDuLieu[0] ?? []).map((cell) => String(cell ?? "").trim()));

  if (headers.length === 0) {
    throw LoiUngDung.yeuCauSai("Không tìm thấy dòng tiêu đề trong file thời khóa biểu");
  }

  const dataRows = dongCoDuLieu.slice(1).map((row) => {
    const item: DongImportThoiKhoaBieu = {};

    headers.forEach((header, index) => {
      item[header] = row[index] ?? null;
    });

    return item;
  });

  return { headers, rows: dataRows };
};

const tachDongBangText = (line: string) => {
  const byTableSeparator = line
    .split(/\s{2,}|\t|\|/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (byTableSeparator.length > 1) {
    return byTableSeparator;
  }

  return line
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const docCsv = (buffer: Buffer) => {
  const lines = buffer
    .toString("utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return bangTuMangDong(lines.map((line) => tachDongBangText(line)));
};

export class BoDocTepImportThoiKhoaBieuXlsxPdf implements BoDocTepImportThoiKhoaBieu {
  async doc(tep: TepImportThoiKhoaBieu): Promise<KetQuaDocTepImportThoiKhoaBieu> {
    const extension = layPhanMoRong(tep.tenFile);

    if (MIME_EXCEL.has(tep.mimeType) || extension === "xlsx" || extension === "xls") {
      return this.docExcel(tep.buffer);
    }

    if (tep.mimeType === MIME_PDF || extension === "pdf") {
      return this.docPdf(tep.buffer);
    }

    if (MIME_CSV.has(tep.mimeType) || extension === "csv") {
      const { headers, rows } = docCsv(tep.buffer);
      return {
        headers,
        rows,
        suggestedMapping: goiYMappingCotImportThoiKhoaBieu(headers),
        sourceType: "CSV"
      };
    }

    throw LoiUngDung.yeuCauSai("Định dạng file thời khóa biểu không được hỗ trợ");
  }

  private docExcel(buffer: Buffer): KetQuaDocTepImportThoiKhoaBieu {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false, raw: false });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw LoiUngDung.yeuCauSai("File Excel không có sheet dữ liệu");
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: null,
      raw: false
    });
    const { headers, rows } = bangTuMangDong(rawRows);

    return {
      headers,
      rows,
      suggestedMapping: goiYMappingCotImportThoiKhoaBieu(headers),
      sourceType: "EXCEL"
    };
  }

  private async docPdf(buffer: Buffer): Promise<KetQuaDocTepImportThoiKhoaBieu> {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });

    try {
      const parsed = await parser.getText();
      const tableRows = parsed.text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => tachDongBangText(line))
        .filter((row) => row.length > 1);

      const { headers, rows } = bangTuMangDong(tableRows);

      return {
        headers,
        rows,
        suggestedMapping: goiYMappingCotImportThoiKhoaBieu(headers),
        sourceType: "PDF"
      };
    } finally {
      await parser.destroy();
    }
  }
}
