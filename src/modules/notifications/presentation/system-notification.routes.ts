import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import { BoDieuKhienThongBaoHeThong, luocDoGuiThongBaoHeThong } from "./system-notification.controller.js";

const CAC_VAI_TRO_QUAN_TRI_VIEN = ["QUAN_TRI_VIEN"] as const;

export const xayDungTuyenDuongThongBaoHeThong = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const auth = new BoTrungGianXacThuc(boPhuThuoc);
  const controller = new BoDieuKhienThongBaoHeThong(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(CAC_VAI_TRO_QUAN_TRI_VIEN));

  router.post("/", xacThucYeuCau(luocDoGuiThongBaoHeThong), controller.guiThongBaoHeThong);

  return router;
};
