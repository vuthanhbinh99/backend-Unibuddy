import { CAC_MUC_DO_GHI_NHO_FLASHCARD, type MucDoGhiNhoFlashcard } from "../../domain/flashcard.js";

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const DO_DAI_TOI_DA_TEN_BO_FLASHCARD = 255;
export const DO_DAI_TOI_DA_NOI_DUNG_THE_FLASHCARD = 5000;

export const laUuidHopLe = (value?: string | null) => Boolean(value && UUID_PATTERN.test(value));

export const laMucDoGhiNhoFlashcard = (value: string): value is MucDoGhiNhoFlashcard =>
  CAC_MUC_DO_GHI_NHO_FLASHCARD.includes(value as MucDoGhiNhoFlashcard);

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
