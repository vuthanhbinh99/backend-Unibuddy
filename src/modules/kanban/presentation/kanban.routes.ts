import { Router } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import {
  BoDieuKhienKanban,
  luocDoBinhLuanCongViecKanban,
  luocDoCapNhatThongTinCongViecKanban,
  luocDoCapNhatTrangThaiCongViecKanban,
  luocDoLayLienKetNhomChatKanban,
  luocDoPhanCongCongViecKanban,
  luocDoTaoCongViecKanban,
  luocDoThuHoiBinhLuanCongViecKanban,
  luocDoXemBangKanban,
  luocDoXoaCongViecKanban
} from "./kanban.controller.js";

const SINH_VIEN = ["SINH_VIEN"] as const;

export const xayDungTuyenDuongKanban = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienKanban(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(SINH_VIEN));

  router.get("/groups/:maNhom/board", xacThucYeuCau(luocDoXemBangKanban), controller.xemBang);
  router.get(
    "/groups/:maNhom/chat-link",
    xacThucYeuCau(luocDoLayLienKetNhomChatKanban),
    controller.layLienKetNhomChat
  );
  router.post("/tasks", xacThucYeuCau(luocDoTaoCongViecKanban), controller.tao);
  router.put(
    "/tasks/:maCongViec",
    xacThucYeuCau(luocDoCapNhatThongTinCongViecKanban),
    controller.capNhatThongTin
  );
  router.patch(
    "/tasks/:maCongViec/status",
    xacThucYeuCau(luocDoCapNhatTrangThaiCongViecKanban),
    controller.capNhatTrangThai
  );
  router.patch(
    "/tasks/:maCongViec/assignee",
    xacThucYeuCau(luocDoPhanCongCongViecKanban),
    controller.phanCong
  );
  router.post(
    "/tasks/:maCongViec/comments",
    xacThucYeuCau(luocDoBinhLuanCongViecKanban),
    controller.binhLuan
  );
  router.delete(
    "/tasks/:maCongViec/comments/:maBinhLuan",
    xacThucYeuCau(luocDoThuHoiBinhLuanCongViecKanban),
    controller.thuHoiBinhLuan
  );
  router.delete("/tasks/:maCongViec", xacThucYeuCau(luocDoXoaCongViecKanban), controller.xoa);

  return router;
};
