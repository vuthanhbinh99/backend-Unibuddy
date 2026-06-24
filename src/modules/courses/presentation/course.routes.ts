import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import {
  BoDieuKhienHocPhan,
  luocDoCapNhatHocPhan,
  luocDoChiTietHocPhan,
  luocDoDanhSachHocPhan,
  luocDoTaoHocKy,
  luocDoTaoHocPhan,
  luocDoTaoHocPhanTrongHocKy,
  luocDoXoaHocPhan
} from "./course.controller.js";

const SINH_VIEN = ["SINH_VIEN"] as const;

export const xayDungTuyenDuongHocPhan = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienHocPhan(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(SINH_VIEN));

  router.get("/", xacThucYeuCau(luocDoDanhSachHocPhan), controller.lietKe);
  router.post("/semesters", xacThucYeuCau(luocDoTaoHocKy), controller.taoHocKy);
  router.post("/semesters/:maHocKy/courses", xacThucYeuCau(luocDoTaoHocPhanTrongHocKy), controller.taoTrongHocKy);
  router.get("/:maMonHoc", xacThucYeuCau(luocDoChiTietHocPhan), controller.chiTiet);
  router.post("/", xacThucYeuCau(luocDoTaoHocPhan), controller.tao);
  router.put("/:maMonHoc", xacThucYeuCau(luocDoCapNhatHocPhan), controller.capNhat);
  router.delete("/:maMonHoc", xacThucYeuCau(luocDoXoaHocPhan), controller.xoa);

  return router;
};
