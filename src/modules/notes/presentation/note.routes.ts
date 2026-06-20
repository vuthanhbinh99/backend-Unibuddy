import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import {
  BoDieuKhienGhiChu,
  luocDoCapNhatGhiChu,
  luocDoChiTietGhiChu,
  luocDoDanhSachGhiChu,
  luocDoTaoGhiChu,
  luocDoXoaGhiChu
} from "./note.controller.js";

const CAC_VAI_TRO_SINH_VIEN = ["SINH_VIEN"] as const;

export const xayDungTuyenDuongGhiChu = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienGhiChu(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(CAC_VAI_TRO_SINH_VIEN));

  router.get("/", xacThucYeuCau(luocDoDanhSachGhiChu), controller.lietKe);
  router.get("/:maGhiChu", xacThucYeuCau(luocDoChiTietGhiChu), controller.chiTiet);
  router.post("/", xacThucYeuCau(luocDoTaoGhiChu), controller.tao);
  router.put("/:maGhiChu", xacThucYeuCau(luocDoCapNhatGhiChu), controller.capNhat);
  router.delete("/:maGhiChu", xacThucYeuCau(luocDoXoaGhiChu), controller.xoa);

  return router;
};
