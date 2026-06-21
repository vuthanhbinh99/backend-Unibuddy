import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import {
  BoDieuKhienLichHoc,
  luocDoCapNhatLichHoc,
  luocDoDanhSachLichHoc,
  luocDoPreviewImportThoiKhoaBieu,
  luocDoTaoLichHoc,
  luocDoXacNhanImportThoiKhoaBieu,
  luocDoXoaLichHoc
} from "./schedule.controller.js";

const SINH_VIEN = ["SINH_VIEN"] as const;
const DUNG_LUONG_FILE_IMPORT_TOI_DA = 10 * 1024 * 1024;

const uploadImport = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: DUNG_LUONG_FILE_IMPORT_TOI_DA
  }
});

const taiFileImportThoiKhoaBieu = (req: Request, res: Response, next: NextFunction) => {
  uploadImport.single("file")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(LoiUngDung.yeuCauSai("File thời khóa biểu vượt quá dung lượng tối đa 10MB"));
      return;
    }

    next(LoiUngDung.yeuCauSai("Không thể tải file thời khóa biểu, vui lòng kiểm tra lại định dạng và dung lượng"));
  });
};

export const xayDungTuyenDuongLichHoc = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienLichHoc(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(SINH_VIEN));

  router.get("/", xacThucYeuCau(luocDoDanhSachLichHoc), controller.lietKe);
  router.post("/", xacThucYeuCau(luocDoTaoLichHoc), controller.tao);
  router.post("/import/headers", taiFileImportThoiKhoaBieu, controller.trichXuatHeaderImport);
  router.post("/import/preview", xacThucYeuCau(luocDoPreviewImportThoiKhoaBieu), controller.previewImport);
  router.post("/import/confirm", xacThucYeuCau(luocDoXacNhanImportThoiKhoaBieu), controller.xacNhanImport);
  router.put("/:maLichHoc", xacThucYeuCau(luocDoCapNhatLichHoc), controller.capNhat);
  router.delete("/:maLichHoc", xacThucYeuCau(luocDoXoaLichHoc), controller.xoa);

  return router;
};
