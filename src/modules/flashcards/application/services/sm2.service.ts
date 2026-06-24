import type { MucDoGhiNhoFlashcard, TheFlashcard } from "../../domain/flashcard.js";

const SO_MILI_GIAY_MOT_NGAY = 24 * 60 * 60 * 1000;
const DIEM_GHI_NHO_MAC_DINH = 2.5;
const DIEM_GHI_NHO_TOI_THIEU = 1.3;

const quyDoiMucDoThanhDiem = (mucDo: MucDoGhiNhoFlashcard) => {
  if (mucDo === "KHO_QUEN") {
    return 2;
  }

  if (mucDo === "TRUNG_BINH") {
    return 4;
  }

  return 5;
};

const congNgay = (ngayGoc: Date, soNgay: number) => new Date(ngayGoc.getTime() + soNgay * SO_MILI_GIAY_MOT_NGAY);

const tinhKhoangCachCu = (the: TheFlashcard) => {
  if (!the.thoiGianLanOnCuoi || !the.thoiGianLanOnTiepTheo) {
    return null;
  }

  const soNgay = Math.round(
    (the.thoiGianLanOnTiepTheo.getTime() - the.thoiGianLanOnCuoi.getTime()) / SO_MILI_GIAY_MOT_NGAY
  );

  return Number.isFinite(soNgay) && soNgay > 0 ? soNgay : null;
};

export const tinhTienDoSm2 = (the: TheFlashcard, mucDo: MucDoGhiNhoFlashcard, thoiDiemOn = new Date()) => {
  const q = quyDoiMucDoThanhDiem(mucDo);
  const diemGhiNhoCu = Number.isFinite(the.diemGhiNho) && the.diemGhiNho > 0 ? the.diemGhiNho : DIEM_GHI_NHO_MAC_DINH;
  const diemGhiNhoMoi = Math.max(
    DIEM_GHI_NHO_TOI_THIEU,
    diemGhiNhoCu + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  let soLanOnMoi = the.soLanOn;
  let khoangCachNgay = 1;

  if (q < 3) {
    soLanOnMoi = 0;
    khoangCachNgay = 1;
  } else {
    soLanOnMoi += 1;

    if (soLanOnMoi === 1) {
      khoangCachNgay = 1;
    } else if (soLanOnMoi === 2) {
      khoangCachNgay = 6;
    } else {
      khoangCachNgay = Math.max(1, Math.round((tinhKhoangCachCu(the) ?? 6) * diemGhiNhoMoi));
    }
  }

  return {
    q,
    soLanOn: soLanOnMoi,
    diemGhiNho: Number(diemGhiNhoMoi.toFixed(2)),
    khoangCachNgay,
    thoiGianLanOnCuoi: thoiDiemOn,
    thoiGianLanOnTiepTheo: congNgay(thoiDiemOn, khoangCachNgay)
  };
};
