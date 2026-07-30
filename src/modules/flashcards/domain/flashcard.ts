export const CAC_MUC_DO_GHI_NHO_FLASHCARD = ["KHO_QUEN", "TRUNG_BINH", "DE"] as const;

export type MucDoGhiNhoFlashcard = (typeof CAC_MUC_DO_GHI_NHO_FLASHCARD)[number];

export const CAC_LOAI_THE_FLASHCARD = ["TU_LUAN", "TRAC_NGHIEM"] as const;

export type LoaiThe = (typeof CAC_LOAI_THE_FLASHCARD)[number];

export const CAC_KET_QUA_ON_TAP_FLASHCARD = ["DUNG", "SAI"] as const;

export type KetQuaOnTapFlashcard = (typeof CAC_KET_QUA_ON_TAP_FLASHCARD)[number];

export type LuaChonTracNghiem = {
  id: string;
  noiDung: string;
};

export type NoiDungTracNghiem = {
  cauHoi: string;
  cacLuaChon: LuaChonTracNghiem[];
  dapAnDung: string;
  giaiThich: string;
};

/**
 * Mặt sau của thẻ: chuỗi thuần với thẻ tự luận, hoặc cấu trúc trắc nghiệm với thẻ TRAC_NGHIEM.
 */
export type MatSauFlashcard = string | NoiDungTracNghiem;

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
  loaiThe: LoaiThe;
  matTruoc: string;
  matSau: MatSauFlashcard;
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
  loaiThe?: LoaiThe;
  matTruoc: string;
  matSau: MatSauFlashcard;
};

export type DuLieuCapNhatTheFlashcard = {
  maFlashcard: string;
  loaiThe?: LoaiThe;
  matTruoc: string;
  matSau: MatSauFlashcard;
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

export const laLoaiTheHopLe = (value?: string | null): value is LoaiThe =>
  CAC_LOAI_THE_FLASHCARD.includes(value as LoaiThe);

const laNoiDungTracNghiem = (value: unknown): value is NoiDungTracNghiem =>
  typeof value === "object" &&
  value !== null &&
  "cauHoi" in value &&
  "cacLuaChon" in value &&
  Array.isArray((value as NoiDungTracNghiem).cacLuaChon);

/**
 * Chuẩn hóa mặt sau để ghi xuống cột JSONB.
 * - Tự luận: bọc chuỗi thành { text } để giữ cấu trúc JSONB nhất quán.
 * - Trắc nghiệm: giữ nguyên cấu trúc NoiDungTracNghiem.
 */
export const chuanHoaMatSauDeGhi = (matSau: MatSauFlashcard): unknown => {
  if (typeof matSau === "string") {
    return { text: matSau };
  }

  return matSau;
};

/**
 * Đọc mặt sau từ giá trị JSONB (đã được node-pg parse sẵn thành JS).
 * Hỗ trợ dữ liệu cũ (chuỗi thuần sau khi to_jsonb) lẫn dữ liệu mới ({ text } hoặc trắc nghiệm).
 */
export const docMatSauTuJsonb = (loaiThe: LoaiThe, raw: unknown): MatSauFlashcard => {
  if (loaiThe === "TRAC_NGHIEM" && laNoiDungTracNghiem(raw)) {
    return {
      cauHoi: String(raw.cauHoi ?? ""),
      cacLuaChon: raw.cacLuaChon.map((luaChon) => ({
        id: String(luaChon.id ?? ""),
        noiDung: String(luaChon.noiDung ?? "")
      })),
      dapAnDung: String(raw.dapAnDung ?? ""),
      giaiThich: String(raw.giaiThich ?? "")
    };
  }

  if (typeof raw === "string") {
    return raw;
  }

  if (raw && typeof raw === "object" && "text" in raw) {
    return String((raw as { text: unknown }).text ?? "");
  }

  return raw == null ? "" : JSON.stringify(raw);
};
