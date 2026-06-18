import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import {
  BoDieuKhienHocThuatTruongHoc,
  luocDoCapNhatQuyCheHocLuc,
  luocDoCapNhatThangDiem,
  luocDoLayCauHinhHocThuat
} from "./academic-rules.controller.js";

export const xayDungTuyenDuongHocThuatTruongHoc = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router({ mergeParams: true });
  const controller = new BoDieuKhienHocThuatTruongHoc(boPhuThuoc);

  router.get("/", xacThucYeuCau(luocDoLayCauHinhHocThuat), controller.layCauHinh);
  router.put("/score-scale", xacThucYeuCau(luocDoCapNhatThangDiem), controller.capNhatThangDiem);
  router.put(
    "/academic-standing",
    xacThucYeuCau(luocDoCapNhatQuyCheHocLuc),
    controller.capNhatQuyCheHocLuc
  );

  return router;
};
