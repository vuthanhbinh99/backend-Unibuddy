import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import {
  BoDieuKhienThongBaoNguoiDung,
  luocDoDanhDauDaDocThongBao,
  luocDoDanhDauTatCaDaDocThongBao,
  luocDoDanhSachThongBaoNguoiDung
} from "./user-notification.controller.js";

export const xayDungTuyenDuongThongBaoNguoiDung = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const auth = new BoTrungGianXacThuc(boPhuThuoc);
  const controller = new BoDieuKhienThongBaoNguoiDung(boPhuThuoc);

  router.use(auth.yeuCauXacThuc);

  router.get("/", xacThucYeuCau(luocDoDanhSachThongBaoNguoiDung), controller.lietKe);
  router.patch("/read-all", xacThucYeuCau(luocDoDanhDauTatCaDaDocThongBao), controller.danhDauTatCaDaDoc);
  router.patch("/:maThongBao/read", xacThucYeuCau(luocDoDanhDauDaDocThongBao), controller.danhDauDaDoc);

  return router;
};
