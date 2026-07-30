export type TepTaiLieuFlashcard = {
  tenFile: string;
  mimeType: string;
  buffer: Buffer;
};

export type KetQuaTrichXuatVanBan = {
  text: string;
  sourceType: "PDF" | "DOCX" | "TXT";
};

export interface BoTrichXuatVanBanTaiLieu {
  trichXuat(tep: TepTaiLieuFlashcard): Promise<KetQuaTrichXuatVanBan>;
}
