import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import {
  BoDieuKhienDeadline,
  luocDoCapNhatTrangThaiDeadline,
  luocDoDanhSachDeadline,
  luocDoTaoDeadline,
  luocDoXoaDeadline
} from "./deadline.controller.js";

const SINH_VIEN = ["SINH_VIEN"] as const;

export const xayDungTuyenDuongDeadline = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienDeadline(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(SINH_VIEN));

  router.get("/", xacThucYeuCau(luocDoDanhSachDeadline), controller.lietKe);
  router.post("/", xacThucYeuCau(luocDoTaoDeadline), controller.tao);
  router.patch("/:maDeadline/status", xacThucYeuCau(luocDoCapNhatTrangThaiDeadline), controller.capNhatTrangThai);
  router.delete("/:maDeadline", xacThucYeuCau(luocDoXoaDeadline), controller.xoa);

  return router;
};
