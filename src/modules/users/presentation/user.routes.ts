import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import { BoDieuKhienNguoiDung } from "./user.controller.js";

export const xayDungTuyenDuongNguoiDung = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienNguoiDung(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.get("/me", auth.yeuCauXacThuc, controller.thongTinCuaToi);

  return router;
};



