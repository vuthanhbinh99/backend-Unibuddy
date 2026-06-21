import type { DongImportThoiKhoaBieu, MappingCotImportThoiKhoaBieu } from "../../domain/schedule.js";

export type TepImportThoiKhoaBieu = {
  buffer: Buffer;
  tenFile: string;
  mimeType: string;
};

export type KetQuaDocTepImportThoiKhoaBieu = {
  headers: string[];
  rows: DongImportThoiKhoaBieu[];
  suggestedMapping: Partial<MappingCotImportThoiKhoaBieu>;
  sourceType: "EXCEL" | "PDF" | "CSV";
};

export interface BoDocTepImportThoiKhoaBieu {
  doc(tep: TepImportThoiKhoaBieu): Promise<KetQuaDocTepImportThoiKhoaBieu>;
}
