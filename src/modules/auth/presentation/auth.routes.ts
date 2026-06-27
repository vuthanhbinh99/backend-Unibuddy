import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import {
  BoDieuKhienXacThuc,
  luocDoDatLaiMatKhau,
  luocDoDangKySinhVien,
  luocDoDangNhapGoogle,
  luocDoDangNhap,
  luocDoDangXuat,
  luocDoLamMoiToken,
  luocDoXacThucMaQuenMatKhau,
  luocDoYeuCauQuenMatKhau
} from "./auth.controller.js";

export const xayDungTuyenDuongXacThuc = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienXacThuc(boPhuThuoc);

  router.post("/register", xacThucYeuCau(luocDoDangKySinhVien), controller.dangKySinhVien);
  router.post("/login", xacThucYeuCau(luocDoDangNhap), controller.dangNhap);
  router.post("/google", xacThucYeuCau(luocDoDangNhapGoogle), controller.dangNhapGoogle);
  router.post("/refresh", xacThucYeuCau(luocDoLamMoiToken), controller.lamMoiToken);
  router.post("/logout", xacThucYeuCau(luocDoDangXuat), controller.dangXuat);
  router.post(
    "/forgot-password",
    xacThucYeuCau(luocDoYeuCauQuenMatKhau),
    controller.yeuCauQuenMatKhau
  );
  router.post(
    "/forgot-password/verify",
    xacThucYeuCau(luocDoXacThucMaQuenMatKhau),
    controller.xacThucMaQuenMatKhau
  );
  router.post(
    "/forgot-password/reset",
    xacThucYeuCau(luocDoDatLaiMatKhau),
    controller.datLaiMatKhau
  );

  return router;
};



