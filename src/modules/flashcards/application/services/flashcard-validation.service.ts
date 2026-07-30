import {
  CAC_KET_QUA_ON_TAP_FLASHCARD,
  CAC_MUC_DO_GHI_NHO_FLASHCARD,
  type KetQuaOnTapFlashcard,
  type MucDoGhiNhoFlashcard,
  type NoiDungTracNghiem
} from "../../domain/flashcard.js";

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const DO_DAI_TOI_DA_TEN_BO_FLASHCARD = 255;
export const DO_DAI_TOI_DA_NOI_DUNG_THE_FLASHCARD = 5000;

export const laUuidHopLe = (value?: string | null) => Boolean(value && UUID_PATTERN.test(value));

export const laMucDoGhiNhoFlashcard = (value: string): value is MucDoGhiNhoFlashcard =>
  CAC_MUC_DO_GHI_NHO_FLASHCARD.includes(value as MucDoGhiNhoFlashcard);

export const laKetQuaOnTapFlashcard = (value: string): value is KetQuaOnTapFlashcard =>
  CAC_KET_QUA_ON_TAP_FLASHCARD.includes(value as KetQuaOnTapFlashcard);

export const chuanHoaChuoi = (value?: string | null) => value?.trim() ?? "";

export const kiemTraTenBoFlashcard = (tenBo?: string | null) => {
  const tenBoHopLe = chuanHoaChuoi(tenBo);
  const loi: string[] = [];

  if (!tenBoHopLe) {
    loi.push("Tên bộ flashcard không được để trống!");
  }

  if (tenBoHopLe.length > DO_DAI_TOI_DA_TEN_BO_FLASHCARD) {
    loi.push("Tên bộ flashcard không được vượt quá 255 ký tự");
  }

  return { tenBo: tenBoHopLe, loi };
};

export const kiemTraNoiDungTheFlashcard = (input: {
  matTruoc?: string | null;
  matSau?: string | null;
}) => {
  const matTruoc = chuanHoaChuoi(input.matTruoc);
  const matSau = chuanHoaChuoi(input.matSau);
  const loi: string[] = [];

  if (!matTruoc || !matSau) {
    loi.push("Nội dung thẻ không được để trống!");
  }

  if (matTruoc.length > DO_DAI_TOI_DA_NOI_DUNG_THE_FLASHCARD) {
    loi.push("Mặt trước không được vượt quá 5000 ký tự");
  }

  if (matSau.length > DO_DAI_TOI_DA_NOI_DUNG_THE_FLASHCARD) {
    loi.push("Mặt sau không được vượt quá 5000 ký tự");
  }

  return { matTruoc, matSau, loi };
};

export const SO_LUA_CHON_TRAC_NGHIEM_TOI_THIEU = 2;
export const SO_LUA_CHON_TRAC_NGHIEM_TOI_DA = 6;

type NoiDungTracNghiemTho = {
  cauHoi?: string | null;
  cacLuaChon?: Array<{ id?: string | null; noiDung?: string | null }> | null;
  dapAnDung?: string | null;
  giaiThich?: string | null;
};

/**
 * Chuẩn hóa và kiểm tra nội dung thẻ trắc nghiệm do người dùng nhập thủ công.
 * Trả về nội dung đã chuẩn hóa (id lựa chọn viết hoa, cắt khoảng trắng) kèm danh sách lỗi.
 */
export const kiemTraNoiDungTracNghiem = (input: NoiDungTracNghiemTho) => {
  const loi: string[] = [];
  const cauHoi = chuanHoaChuoi(input.cauHoi);
  const giaiThich = chuanHoaChuoi(input.giaiThich);

  if (!cauHoi) {
    loi.push("Câu hỏi trắc nghiệm không được để trống!");
  }

  if (cauHoi.length > DO_DAI_TOI_DA_NOI_DUNG_THE_FLASHCARD) {
    loi.push("Câu hỏi không được vượt quá 5000 ký tự");
  }

  const cacLuaChon = (input.cacLuaChon ?? [])
    .map((luaChon) => ({
      id: chuanHoaChuoi(luaChon?.id).toUpperCase(),
      noiDung: chuanHoaChuoi(luaChon?.noiDung)
    }))
    .filter((luaChon) => luaChon.id || luaChon.noiDung);

  if (cacLuaChon.length < SO_LUA_CHON_TRAC_NGHIEM_TOI_THIEU) {
    loi.push("Thẻ trắc nghiệm cần ít nhất 2 lựa chọn");
  }

  if (cacLuaChon.length > SO_LUA_CHON_TRAC_NGHIEM_TOI_DA) {
    loi.push("Thẻ trắc nghiệm không được vượt quá 6 lựa chọn");
  }

  if (cacLuaChon.some((luaChon) => !luaChon.id || !luaChon.noiDung)) {
    loi.push("Mỗi lựa chọn cần có mã và nội dung");
  }

  const cacMa = cacLuaChon.map((luaChon) => luaChon.id);
  if (new Set(cacMa).size !== cacMa.length) {
    loi.push("Mã các lựa chọn không được trùng nhau");
  }

  const dapAnDung = chuanHoaChuoi(input.dapAnDung).toUpperCase();
  if (!dapAnDung) {
    loi.push("Vui lòng chọn đáp án đúng");
  } else if (!cacMa.includes(dapAnDung)) {
    loi.push("Đáp án đúng phải nằm trong các lựa chọn");
  }

  const noiDung: NoiDungTracNghiem = {
    cauHoi,
    cacLuaChon,
    dapAnDung,
    giaiThich
  };

  return { noiDung, loi };
};
