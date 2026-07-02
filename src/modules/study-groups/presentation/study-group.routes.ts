import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import {
  BoDieuKhienNhomHocTap,
  luocDoDanhSachNhomHocTap,
  luocDoRoiNhomHocTap,
  luocDoTaoNhomHocTap,
  luocDoThamGiaNhomHocTap,
  luocDoXoaNhomHocTap
} from "./study-group.controller.js";

const SINH_VIEN = ["SINH_VIEN"] as const;

export const xayDungTuyenDuongNhomHocTap = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienNhomHocTap(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(SINH_VIEN));

  router.get("/", xacThucYeuCau(luocDoDanhSachNhomHocTap), controller.danhSach);
  router.post("/", xacThucYeuCau(luocDoTaoNhomHocTap), controller.tao);
  router.post("/join", xacThucYeuCau(luocDoThamGiaNhomHocTap), controller.thamGia);
  router.post("/:maNhom/leave", xacThucYeuCau(luocDoRoiNhomHocTap), controller.roi);
  router.delete("/:maNhom", xacThucYeuCau(luocDoXoaNhomHocTap), controller.xoa);

  return router;
};
