import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import { BoDieuKhienTaiLieu, luocDoUploadChiaSeTaiLieu } from "./document.controller.js";

const CAC_VAI_TRO_SINH_VIEN = ["SINH_VIEN"] as const;

export const xayDungTuyenDuongTaiLieuSinhVien = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienTaiLieu(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(CAC_VAI_TRO_SINH_VIEN));

  router.post("/", xacThucYeuCau(luocDoUploadChiaSeTaiLieu), controller.uploadChiaSe);

  return router;
};
