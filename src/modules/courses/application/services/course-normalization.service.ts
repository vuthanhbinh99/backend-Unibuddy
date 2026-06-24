import type { DuLieuCapNhatHocPhan, DuLieuTaoHocPhan } from "../../domain/course.js";

export const SO_TIN_CHI_MAC_DINH_IMPORT = 1;

export const chuanHoaMaMon = (maMon?: string | null) => {
  const value = maMon?.trim();
  return value ? value : null;
};

export const chuanHoaTenMon = (tenMon: string) => tenMon.trim();

export const chuanHoaSoTinChiImport = (soTinChi?: number | null) =>
  soTinChi && Number.isFinite(soTinChi) && soTinChi > 0 ? Math.trunc(soTinChi) : SO_TIN_CHI_MAC_DINH_IMPORT;

export const chuanHoaDuLieuHocPhan = <T extends DuLieuTaoHocPhan | DuLieuCapNhatHocPhan>(data: T): T => ({
  ...data,
  maMon: chuanHoaMaMon(data.maMon),
  tenMon: chuanHoaTenMon(data.tenMon),
  soTinChi: Math.trunc(data.soTinChi)
});
