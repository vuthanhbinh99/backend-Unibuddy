import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import {
  BoDieuKhienQuanTriHeThong,
  luocDoChiTietLoiHeThong,
  luocDoDanhSachLoiHeThong,
  luocDoDanhSachNhatKyHeThong,
  luocDoXemDungLuongLuuTru
} from "./system-admin.controller.js";

const CAC_VAI_TRO_QUAN_TRI_VIEN = ["QUAN_TRI_VIEN"] as const;

export const xayDungTuyenDuongQuanTriHeThong = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const auth = new BoTrungGianXacThuc(boPhuThuoc);
  const controller = new BoDieuKhienQuanTriHeThong(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(CAC_VAI_TRO_QUAN_TRI_VIEN));

  router.get("/storage-usage", xacThucYeuCau(luocDoXemDungLuongLuuTru), controller.xemDungLuongLuuTru);
  router.get("/audit-logs", xacThucYeuCau(luocDoDanhSachNhatKyHeThong), controller.xemNhatKyHeThong);
  router.get("/error-logs", xacThucYeuCau(luocDoDanhSachLoiHeThong), controller.xemLoiHeThong);
  router.get("/error-logs/:logId", xacThucYeuCau(luocDoChiTietLoiHeThong), controller.xemChiTietLoiHeThong);

  return router;
};
