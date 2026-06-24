import type { DongImportDiemSo, MappingCotImportDiemSo } from "../../domain/grade.js";

export type TepImportDiemSo = {
  buffer: Buffer;
  tenFile: string;
  mimeType: string;
};

export type KetQuaDocTepImportDiemSo = {
  headers: string[];
  rows: DongImportDiemSo[];
  suggestedMapping: Partial<MappingCotImportDiemSo>;
  sourceType: "EXCEL" | "CSV" | "TEXT";
};

export interface BoDocTepImportDiemSo {
  doc(tep: TepImportDiemSo): Promise<KetQuaDocTepImportDiemSo> | KetQuaDocTepImportDiemSo;
}

