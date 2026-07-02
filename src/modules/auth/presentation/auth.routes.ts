import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "./auth.middleware.js";
import {
  BoDieuKhienXacThuc,
  luocDoLietKePhienDangNhap,
  luocDoDatLaiMatKhau,
  luocDoDangKySinhVien,
  luocDoDangNhapGoogle,
  luocDoDangNhap,
  luocDoDangXuat,
  luocDoThuHoiPhienDangNhap,
  luocDoLamMoiToken,
  luocDoXacThucMaQuenMatKhau,
  luocDoYeuCauQuenMatKhau
} from "./auth.controller.js";

export const xayDungTuyenDuongXacThuc = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienXacThuc(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.post("/register", xacThucYeuCau(luocDoDangKySinhVien), controller.dangKySinhVien);
  router.post("/login", xacThucYeuCau(luocDoDangNhap), controller.dangNhap);
  router.post("/google", xacThucYeuCau(luocDoDangNhapGoogle), controller.dangNhapGoogle);
  router.post("/refresh", xacThucYeuCau(luocDoLamMoiToken), controller.lamMoiToken);
  router.post("/logout", xacThucYeuCau(luocDoDangXuat), controller.dangXuat);
  router.post(
    "/sessions",
    auth.yeuCauXacThuc,
    xacThucYeuCau(luocDoLietKePhienDangNhap),
    controller.lietKePhienDangNhap
  );
  router.delete(
    "/sessions/:sessionId",
    auth.yeuCauXacThuc,
    xacThucYeuCau(luocDoThuHoiPhienDangNhap),
    controller.thuHoiPhienDangNhap
  );
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



