import { LoiUngDung } from "../../../../shared/errors/app-error.js";

export type GiaiDoanImportThoiKhoaBieu =
  | "UPLOAD_FILE"
  | "EXTRACT_HEADERS"
  | "PREVIEW_IMPORT"
  | "PREVIEW_HAS_INVALID_ROWS"
  | "CONFIRM_IMPORT";

const THONG_BAO_NHAP_THU_CONG =
  "Import thời khóa biểu tự động chưa thể hoàn tất. Sinh viên có thể nhập lịch học thủ công.";

export const taoThongTinNhapThuCongThoiKhoaBieu = (stage: GiaiDoanImportThoiKhoaBieu, reason?: unknown) => ({
  enabled: true,
  endpoint: "/api/v1/schedules",
  method: "POST",
  message: THONG_BAO_NHAP_THU_CONG,
  fields: ["maMonHoc", "thu", "tietBatDau", "soTiet", "phongHoc", "ngayBatDau", "ngayKetThuc"],
  stage,
  reason
});

export const taoChiTietImportThatBaiChoNhapThuCong = (
  stage: GiaiDoanImportThoiKhoaBieu,
  reason?: unknown
) => ({
  importTuDongThatBai: true,
  manualEntry: taoThongTinNhapThuCongThoiKhoaBieu(stage, reason)
});

export const boSungHuongDanNhapThuCong = (
  error: LoiUngDung,
  stage: GiaiDoanImportThoiKhoaBieu
) =>
  new LoiUngDung(
    error.maTrangThai,
    error.maLoi,
    error.message,
    taoChiTietImportThatBaiChoNhapThuCong(stage, error.chiTiet)
  );
