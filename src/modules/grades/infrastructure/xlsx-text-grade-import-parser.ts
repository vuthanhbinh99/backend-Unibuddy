import * as XLSX from "xlsx";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import type {
  BoDocTepImportDiemSo,
  KetQuaDocTepImportDiemSo,
  TepImportDiemSo
} from "../application/ports/grade-import-parser.js";
import { goiYMappingCotImportDiemSo } from "../application/services/grade-import-mapper.service.js";
import type { DongImportDiemSo } from "../domain/grade.js";

const MIME_EXCEL = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

const MIME_TEXT = new Set(["text/csv", "text/plain", "application/csv"]);

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

const demCotCoTheMap = (headers: string[]) => Object.keys(goiYMappingCotImportDiemSo(headers)).length;

const timDongTieuDe = (rows: unknown[][]) => {
  let bestIndex = 0;
  let bestScore = -1;
  const gioiHanQuet = Math.min(rows.length, 20);

  for (let index = 0; index < gioiHanQuet; index += 1) {
    const headers = rows[index].map((cell) => String(cell ?? "").trim());
    const soCotCoDuLieu = headers.filter(Boolean).length;
    const score = demCotCoTheMap(headers) * 10 + soCotCoDuLieu;

    if (score > bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  }

  return bestIndex;
};

const bangTuMangDong = (rows: unknown[][]) => {
  const dongCoDuLieu = rows.filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""));
  const headerIndex = timDongTieuDe(dongCoDuLieu);
  const headers = taoTenCotDocNhat((dongCoDuLieu[headerIndex] ?? []).map((cell) => String(cell ?? "").trim()));

  if (headers.length === 0) {
    throw LoiUngDung.yeuCauSai("Không tìm thấy dòng tiêu đề trong file điểm số");
  }

  const dataRows = dongCoDuLieu.slice(headerIndex + 1).map((row) => {
    const item: DongImportDiemSo = {};

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

const docText = (buffer: Buffer) => {
  const lines = buffer
    .toString("utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return bangTuMangDong(lines.map((line) => tachDongBangText(line)));
};

export class BoDocTepImportDiemSoXlsxText implements BoDocTepImportDiemSo {
  doc(tep: TepImportDiemSo): KetQuaDocTepImportDiemSo {
    const extension = layPhanMoRong(tep.tenFile);

    if (MIME_EXCEL.has(tep.mimeType) || extension === "xlsx" || extension === "xls") {
      return this.docExcel(tep.buffer);
    }

    if (MIME_TEXT.has(tep.mimeType) || extension === "csv" || extension === "txt") {
      const { headers, rows } = docText(tep.buffer);
      return {
        headers,
        rows,
        suggestedMapping: goiYMappingCotImportDiemSo(headers),
        sourceType: extension === "csv" ? "CSV" : "TEXT"
      };
    }

    throw LoiUngDung.yeuCauSai("Định dạng file điểm số không được hỗ trợ");
  }

  private docExcel(buffer: Buffer): KetQuaDocTepImportDiemSo {
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
      suggestedMapping: goiYMappingCotImportDiemSo(headers),
      sourceType: "EXCEL"
    };
  }
}
