import { Router } from "express";
import { xayDungBoPhuThuoc } from "./container.js";
import { xayDungTuyenDuongXacThuc } from "./modules/auth/presentation/auth.routes.js";
import { xayDungTuyenDuongTaiLieuSinhVien } from "./modules/documents/presentation/document.routes.js";
import { xayDungTuyenDuongSucKhoe } from "./modules/health/health.routes.js";
import { xayDungTuyenDuongDinhKemGhiChu } from "./modules/notes/presentation/attachment.routes.js";
import { xayDungTuyenDuongGhiChu } from "./modules/notes/presentation/note.routes.js";
import { xayDungTuyenDuongBaoCaoTaiLieu } from "./modules/report-document/presentation/report-document.routes.js";
import { xayDungTuyenDuongLichHoc } from "./modules/schedules/presentation/schedule.routes.js";
import { xayDungTuyenDuongTruongHoc } from "./modules/schools/presentation/school.routes.js";
import { xayDungTuyenDuongNhomHocTap } from "./modules/study-groups/presentation/study-group.routes.js";
import { xayDungTuyenDuongThongBaoHeThong } from "./modules/notifications/presentation/system-notification.routes.js";
import { xayDungTuyenDuongQuanTriHeThong } from "./modules/system-admin/presentation/system-admin.routes.js";
import { xayDungTuyenDuongNguoiDungQuanTri } from "./modules/users/presentation/admin-user.routes.js";
import { xayDungTuyenDuongNguoiDung } from "./modules/users/presentation/user.routes.js";

export const xayDungTuyenDuong = () => {
  const router = Router();
  const boPhuThuoc = xayDungBoPhuThuoc();

  router.use("/health", xayDungTuyenDuongSucKhoe(boPhuThuoc));
  router.use("/auth", xayDungTuyenDuongXacThuc(boPhuThuoc));
  router.use("/users", xayDungTuyenDuongNguoiDung(boPhuThuoc));
  router.use("/notes", xayDungTuyenDuongGhiChu(boPhuThuoc));
  router.use("/attachments", xayDungTuyenDuongDinhKemGhiChu(boPhuThuoc));
  router.use("/schedules", xayDungTuyenDuongLichHoc(boPhuThuoc));
  router.use("/study-groups", xayDungTuyenDuongNhomHocTap(boPhuThuoc));
  router.use("/student/documents", xayDungTuyenDuongTaiLieuSinhVien(boPhuThuoc));
  router.use("/admin/users", xayDungTuyenDuongNguoiDungQuanTri(boPhuThuoc));
  router.use("/admin/schools", xayDungTuyenDuongTruongHoc(boPhuThuoc));
  router.use("/admin/reports", xayDungTuyenDuongBaoCaoTaiLieu(boPhuThuoc));
  router.use("/admin/system-notifications", xayDungTuyenDuongThongBaoHeThong(boPhuThuoc));
  router.use("/admin", xayDungTuyenDuongQuanTriHeThong(boPhuThuoc));

  return router;
};
