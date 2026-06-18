import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../container.js";
import { BoDieuKhienSucKhoe } from "./health.controller.js";

export const xayDungTuyenDuongSucKhoe = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienSucKhoe(boPhuThuoc);

  router.get("/", controller.hienThi);

  return router;
};



