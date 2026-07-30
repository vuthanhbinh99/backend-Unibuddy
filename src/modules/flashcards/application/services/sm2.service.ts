import type { KetQuaOnTapFlashcard, MucDoGhiNhoFlashcard, TheFlashcard } from "../../domain/flashcard.js";

const SO_MILI_GIAY_MOT_NGAY = 24 * 60 * 60 * 1000;
const SO_MILI_GIAY_MOT_PHUT = 60 * 1000;
const NGUONG_PHAN_HOI_NHANH_MS = 5000;
const KHOANG_CACH_ON_LAI_PHUT = 3;
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

/**
 * Quy đổi kết quả bấm nút (Đúng/Sai) + thời gian phản hồi thành mức độ ghi nhớ SM-2.
 * - SAI → KHO_QUEN (đặt lại chuỗi ôn, hiện lại sau vài phút).
 * - ĐÚNG nhanh (< 5s) → DE (giãn cách mạnh).
 * - ĐÚNG chậm → TRUNG_BINH (giãn cách vừa).
 */
export const quyDoiKetQuaClickThanhMucDo = (
  ketQua: KetQuaOnTapFlashcard,
  thoiGianPhanHoiMs: number
): MucDoGhiNhoFlashcard => {
  if (ketQua === "SAI") {
    return "KHO_QUEN";
  }

  return thoiGianPhanHoiMs >= 0 && thoiGianPhanHoiMs < NGUONG_PHAN_HOI_NHANH_MS ? "DE" : "TRUNG_BINH";
};

/**
 * Tính lịch ôn tập tiếp theo dựa trên thao tác bấm nút của sinh viên.
 * Khi trả lời Sai, thẻ được đưa lại trong vài phút thay vì 1 ngày để nhắc lại ngay trong phiên.
 */
export const tinhTienDoTheoClick = (
  the: TheFlashcard,
  ketQua: KetQuaOnTapFlashcard,
  thoiGianPhanHoiMs: number,
  thoiDiemOn = new Date()
) => {
  const mucDo = quyDoiKetQuaClickThanhMucDo(ketQua, thoiGianPhanHoiMs);
  const tienDo = tinhTienDoSm2(the, mucDo, thoiDiemOn);

  if (ketQua === "SAI") {
    return {
      ...tienDo,
      mucDo,
      khoangCachNgay: 0,
      thoiGianLanOnTiepTheo: new Date(thoiDiemOn.getTime() + KHOANG_CACH_ON_LAI_PHUT * SO_MILI_GIAY_MOT_PHUT)
    };
  }

  return { ...tienDo, mucDo };
};
