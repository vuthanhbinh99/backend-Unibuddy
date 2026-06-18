import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import {
  BoDieuKhienBaoCaoTaiLieu,
  luocDoChiTietBaoCaoTaiLieu,
  luocDoDanhSachBaoCaoTaiLieu,
  luocDoDuyetBaoCaoTaiLieu,
  luocDoTuChoiBaoCaoTaiLieu
} from "./report-document.controller.js";

const CAC_VAI_TRO_QUAN_TRI = ["ADMIN", "QUAN_TRI_VIEN"] as const;

export const xayDungTuyenDuongBaoCaoTaiLieu = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienBaoCaoTaiLieu(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(CAC_VAI_TRO_QUAN_TRI));

  router.get("/", xacThucYeuCau(luocDoDanhSachBaoCaoTaiLieu), controller.lietKe);
  router.get("/:maBaoCao", xacThucYeuCau(luocDoChiTietBaoCaoTaiLieu), controller.chiTiet);
  router.post("/:maBaoCao/approve", xacThucYeuCau(luocDoDuyetBaoCaoTaiLieu), controller.duyet);
  router.post("/:maBaoCao/reject", xacThucYeuCau(luocDoTuChoiBaoCaoTaiLieu), controller.tuChoi);

  return router;
};
