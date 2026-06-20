import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import {
  BoDieuKhienNguoiDungQuanTri,
  luocDoCapNhatTrangThaiNguoiDung,
  luocDoCapNhatVaiTroNguoiDung,
  luocDoChiTietNguoiDungQuanTri,
  luocDoDanhSachNguoiDungQuanTri,
  luocDoTaoTaiKhoanQuanTri
} from "./admin-user.controller.js";

const CAC_VAI_TRO_QUAN_TRI_VIEN = ["QUAN_TRI_VIEN"] as const;

export const xayDungTuyenDuongNguoiDungQuanTri = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienNguoiDungQuanTri(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(CAC_VAI_TRO_QUAN_TRI_VIEN));

  router.get("/", xacThucYeuCau(luocDoDanhSachNguoiDungQuanTri), controller.lietKe);
  router.get("/:userId", xacThucYeuCau(luocDoChiTietNguoiDungQuanTri), controller.chiTiet);
  router.post("/", xacThucYeuCau(luocDoTaoTaiKhoanQuanTri), controller.tao);
  router.patch("/:userId/role", xacThucYeuCau(luocDoCapNhatVaiTroNguoiDung), controller.capNhatVaiTro);
  router.patch(
    "/:userId/status",
    xacThucYeuCau(luocDoCapNhatTrangThaiNguoiDung),
    controller.capNhatTrangThai
  );

  return router;
};