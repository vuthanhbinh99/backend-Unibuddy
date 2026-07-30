import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import { BoDieuKhienTroLy, luocDoChatTroLy } from "./assistant.controller.js";

const SINH_VIEN = ["SINH_VIEN"] as const;

export const xayDungTuyenDuongTroLy = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienTroLy(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(SINH_VIEN));

  router.post("/chat", xacThucYeuCau(luocDoChatTroLy), controller.chat);

  return router;
};
