export const CAC_MUC_DO_GHI_NHO_FLASHCARD = ["KHO_QUEN", "TRUNG_BINH", "DE"] as const;

export type MucDoGhiNhoFlashcard = (typeof CAC_MUC_DO_GHI_NHO_FLASHCARD)[number];

export type BoFlashcard = {
  maBo: string;
  maNguoiDung: string;
  maMonHoc: string | null;
  maMon: string | null;
  tenMon: string | null;
  tenBo: string;
  soThe: number;
  soTheCanOn: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TheFlashcard = {
  maFlashcard: string;
  maBo: string;
  maNguoiDung: string;
  matTruoc: string;
  matSau: string;
  soLanOn: number;
  diemGhiNho: number;
  thoiGianLanOnCuoi: Date | null;
  thoiGianLanOnTiepTheo: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MonHocFlashcard = {
  maMonHoc: string;
  maNguoiDung: string;
  maHocKy: string;
  maMon: string | null;
  tenMon: string;
};

export type DuLieuTaoBoFlashcard = {
  maNguoiDung: string;
  maMonHoc: string | null;
  tenBo: string;
};

export type DuLieuCapNhatBoFlashcard = {
  maBo: string;
  tenBo: string;
};

export type DuLieuTaoTheFlashcard = {
  maBo: string;
  matTruoc: string;
  matSau: string;
};

export type DuLieuCapNhatTheFlashcard = {
  maFlashcard: string;
  matTruoc: string;
  matSau: string;
};

export type DuLieuCapNhatTienDoFlashcard = {
  maFlashcard: string;
  soLanOn: number;
  diemGhiNho: number;
  thoiGianLanOnCuoi: Date;
  thoiGianLanOnTiepTheo: Date;
};

export type ThongKeFlashcard = {
  tongSoBo: number;
  tongSoThe: number;
  soTheCanOnHomNay: number;
  soTheChuaOn: number;
  soTheDaThuoc: number;
  tyLeThuocBai: number;
};
