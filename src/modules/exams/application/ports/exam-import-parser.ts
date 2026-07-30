import type { DongImportLichThi, MappingCotImportLichThi } from "../../domain/exam.js";

export type TepImportLichThi = {
  buffer: Buffer;
  tenFile: string;
  mimeType: string;
};

export type KetQuaDocTepImportLichThi = {
  headers: string[];
  rows: DongImportLichThi[];
  suggestedMapping: Partial<MappingCotImportLichThi>;
  sourceType: "EXCEL" | "PDF" | "CSV";
};

export interface BoDocTepImportLichThi {
  doc(tep: TepImportLichThi): Promise<KetQuaDocTepImportLichThi>;
}
