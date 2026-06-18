import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import { xayDungTuyenDuongHocThuatTruongHoc } from "../../academic-rules/presentation/academic-rules.routes.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import {
  BoDieuKhienTruongHoc,
  luocDoCapNhatTruongHoc,
  luocDoChiTietTruongHoc,
  luocDoDanhSachTruongHoc,
  luocDoTaoTruongHoc,
  luocDoXoaTruongHoc
} from "./school.controller.js";

const CAC_VAI_TRO_QUAN_TRI = ["ADMIN", "QUAN_TRI_VIEN"] as const;

export const xayDungTuyenDuongTruongHoc = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienTruongHoc(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(CAC_VAI_TRO_QUAN_TRI));
  router.use("/:maTruongCode/academic-rules", xayDungTuyenDuongHocThuatTruongHoc(boPhuThuoc));

  router.get("/", xacThucYeuCau(luocDoDanhSachTruongHoc), controller.lietKe);
  router.get("/:maTruongCode", xacThucYeuCau(luocDoChiTietTruongHoc), controller.chiTiet);
  router.post("/", xacThucYeuCau(luocDoTaoTruongHoc), controller.tao);
  router.put("/:maTruongCode", xacThucYeuCau(luocDoCapNhatTruongHoc), controller.capNhat);
  router.delete("/:maTruongCode", xacThucYeuCau(luocDoXoaTruongHoc), controller.xoa);

  return router;
};
