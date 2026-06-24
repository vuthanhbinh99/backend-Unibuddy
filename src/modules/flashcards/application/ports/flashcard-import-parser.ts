export type TepImportFlashcard = {
  tenFile: string;
  mimeType: string;
  buffer: Buffer;
};

export type DongImportFlashcardDaParse = {
  rowIndex: number;
  matTruoc: string;
  matSau: string;
};

export type KetQuaDocTepImportFlashcard = {
  headers: string[];
  rows: DongImportFlashcardDaParse[];
  sourceType: "EXCEL" | "CSV";
};

export interface BoDocTepImportFlashcard {
  doc(tep: TepImportFlashcard): KetQuaDocTepImportFlashcard;
}
