import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import {
  BoDieuKhienFlashcard,
  luocDoCapNhatTheFlashcard,
  luocDoCapNhatTienDoFlashcard,
  luocDoThongKeFlashcard,
  luocDoXoaTheFlashcard
} from "./flashcard.controller.js";

const SINH_VIEN = ["SINH_VIEN"] as const;

export const xayDungTuyenDuongFlashcard = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienFlashcard(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(SINH_VIEN));

  router.get("/statistics", xacThucYeuCau(luocDoThongKeFlashcard), controller.thongKe);
  router.put("/:maFlashcard", xacThucYeuCau(luocDoCapNhatTheFlashcard), controller.capNhatThe);
  router.delete("/:maFlashcard", xacThucYeuCau(luocDoXoaTheFlashcard), controller.xoaThe);
  router.patch("/:maFlashcard/progress", xacThucYeuCau(luocDoCapNhatTienDoFlashcard), controller.capNhatTienDo);

  return router;
};
