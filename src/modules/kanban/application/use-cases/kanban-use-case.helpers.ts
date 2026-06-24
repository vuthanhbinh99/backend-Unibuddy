import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { NguoiThamGiaKanban, TrangThaiCongViecKanban } from "../../domain/kanban.js";

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const laUuid = (value: string) => UUID_PATTERN.test(value);

export const laTruongNhom = (thanhVien: NguoiThamGiaKanban | null | undefined) =>
  thanhVien?.vaiTroTrongNhom === "TRUONG_NHOM";

export const chuanHoaChuoi = (value?: string | null) => value?.trim().replace(/\s+/g, " ") ?? "";

export const chuanHoaMoTa = (value?: string | null) => {
  const moTa = value?.trim();
  return moTa ? moTa : null;
};

export const docNgayTuyChon = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }

  const ngay = value instanceof Date ? value : new Date(value);
  return Number.isFinite(ngay.getTime()) ? ngay : null;
};

export const assertUuid = (value: string | undefined | null, message: string) => {
  const ma = value?.trim() ?? "";

  if (!ma || !laUuid(ma)) {
    throw LoiUngDung.yeuCauSai(message);
  }

  return ma;
};

export const canChuyenTrangThaiBangNguoiDung = (trangThai: TrangThaiCongViecKanban) => trangThai !== "TRE_HAN";

export const taoThongTinBaoHiemUx = (maCongViec?: string) => ({
  enabled: true,
  method: "PATCH",
  endpoint: maCongViec ? `/api/v1/kanban/tasks/${maCongViec}/status` : "/api/v1/kanban/tasks/{maCongViec}/status",
  message: "Nếu kéo thả không thuận tiện, hãy mở chi tiết công việc và chuyển trạng thái bằng nút/menu thay thế.",
  controls: ["Chuyển sang Chưa bắt đầu", "Chuyển sang Đang thực hiện", "Chuyển sang Hoàn thành"],
  suggestedUi: "BOTTOM_SHEET_OR_POPUP_MENU"
});
