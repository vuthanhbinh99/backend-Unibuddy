import { LoiUngDung } from "../../../../shared/errors/app-error.js";

export type GiaiDoanImportDiemSo =
  | "UPLOAD_FILE"
  | "EXTRACT_HEADERS"
  | "PREVIEW_IMPORT"
  | "PREVIEW_HAS_INVALID_ROWS"
  | "CONFIRM_IMPORT"
  | "COURSE_MISSING"
  | "CURRENT_SEMESTER";

export const THONG_BAO_IMPORT_DIEM_THIEU_MON_HOC =
  "Trong bảng điểm có những môn học chưa tồn tại trong hệ thống, vui lòng thêm môn học rồi quay lại thêm điểm sau";

export const taoThongTinNhapThuCongDiemSo = (stage: GiaiDoanImportDiemSo, reason?: unknown) => ({
  enabled: true,
  endpoint: "/api/v1/diem-so",
  method: "POST",
  message: "Import điểm số chưa thể hoàn tất. Sinh viên có thể nhập điểm thủ công cho học kỳ này.",
  fields: ["maMonHoc", "tenThanhPhan", "trongSo", "diem"],
  stage,
  reason
});

export const taoChiTietImportDiemThatBaiChoNhapThuCong = (stage: GiaiDoanImportDiemSo, reason?: unknown) => ({
  importTuDongThatBai: true,
  manualEntry: taoThongTinNhapThuCongDiemSo(stage, reason)
});

export const taoThongTinThemMonHocChoImportDiem = (stage: GiaiDoanImportDiemSo, reason?: unknown) => ({
  enabled: true,
  endpoint: "/api/v1/courses/semesters/{maHocKy}/courses",
  method: "POST",
  message: THONG_BAO_IMPORT_DIEM_THIEU_MON_HOC,
  fields: ["maMon", "tenMon", "soTinChi"],
  stage,
  reason
});

export const taoChiTietImportDiemThieuMonHoc = (stage: GiaiDoanImportDiemSo, reason?: unknown) => ({
  importTuDongThatBai: true,
  courseEntry: taoThongTinThemMonHocChoImportDiem(stage, reason)
});

export const boSungHuongDanNhapThuCongDiemSo = (error: LoiUngDung, stage: GiaiDoanImportDiemSo) =>
  new LoiUngDung(
    error.maTrangThai,
    error.maLoi,
    error.message,
    taoChiTietImportDiemThatBaiChoNhapThuCong(stage, error.chiTiet)
  );
