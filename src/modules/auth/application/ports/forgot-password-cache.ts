export type TrangThaiQuenMatKhauTam = {
  userId: string;
  email: string;
  codeHash: string;
  codeExpiresAt: Date;
  failedAttempts: number;
  resetTokenHash: string | null;
  resetTokenExpiresAt: Date | null;
};

export type DuLieuLuuMaQuenMatKhauTam = {
  userId: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
};

export type DuLieuLuuTokenDatLaiMatKhauTam = {
  email: string;
  resetTokenHash: string;
  expiresAt: Date;
};

export interface KhoTamDatLaiMatKhau {
  luuMa(data: DuLieuLuuMaQuenMatKhauTam): void;
  timTheoEmail(email: string): TrangThaiQuenMatKhauTam | null;
  tangSoLanNhapSai(email: string): TrangThaiQuenMatKhauTam | null;
  luuToken(data: DuLieuLuuTokenDatLaiMatKhauTam): void;
  timTheoToken(resetTokenHash: string): TrangThaiQuenMatKhauTam | null;
  xoaTheoEmail(email: string): void;
}
