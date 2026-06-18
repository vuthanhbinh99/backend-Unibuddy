import { Router } from "express";
import { xayDungBoPhuThuoc } from "./container.js";
import { xayDungTuyenDuongXacThuc } from "./modules/auth/presentation/auth.routes.js";
import { xayDungTuyenDuongSucKhoe } from "./modules/health/health.routes.js";
import { xayDungTuyenDuongTruongHoc } from "./modules/schools/presentation/school.routes.js";
import { xayDungTuyenDuongNguoiDung } from "./modules/users/presentation/user.routes.js";

export const xayDungTuyenDuong = () => {
  const router = Router();
  const boPhuThuoc = xayDungBoPhuThuoc();

  router.use("/health", xayDungTuyenDuongSucKhoe(boPhuThuoc));
  router.use("/auth", xayDungTuyenDuongXacThuc(boPhuThuoc));
  router.use("/users", xayDungTuyenDuongNguoiDung(boPhuThuoc));
  router.use("/admin/schools", xayDungTuyenDuongTruongHoc(boPhuThuoc));

  return router;
};



