import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import {
  BoDieuKhienLichThi,
  luocDoCapNhatLichThi,
  luocDoDanhSachLichThi,
  luocDoGoiYMappingLichThiBangAi,
  luocDoPreviewImportLichThi,
  luocDoTaoLichThi,
  luocDoXacNhanImportLichThi,
  luocDoXoaLichThi
} from "./exam.controller.js";

const SINH_VIEN = ["SINH_VIEN"] as const;
const DUNG_LUONG_FILE_IMPORT_TOI_DA = 10 * 1024 * 1024;

const uploadImport = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: DUNG_LUONG_FILE_IMPORT_TOI_DA
  }
});

const taiFileImportLichThi = (req: Request, res: Response, next: NextFunction) => {
  uploadImport.single("file")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(LoiUngDung.yeuCauSai("File lịch thi vượt quá dung lượng tối đa 10MB"));
      return;
    }

    next(LoiUngDung.yeuCauSai("Không thể tải file lịch thi, vui lòng kiểm tra lại định dạng và dung lượng"));
  });
};

export const xayDungTuyenDuongLichThi = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienLichThi(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(SINH_VIEN));

  router.get("/", xacThucYeuCau(luocDoDanhSachLichThi), controller.lietKe);
  router.post("/", xacThucYeuCau(luocDoTaoLichThi), controller.tao);
  router.post("/import/headers", taiFileImportLichThi, controller.trichXuatHeaderImport);
  router.post("/import/preview", xacThucYeuCau(luocDoPreviewImportLichThi), controller.previewImport);
  router.post("/import/confirm", xacThucYeuCau(luocDoXacNhanImportLichThi), controller.xacNhanImport);
  router.post("/ai/suggest-mapping", xacThucYeuCau(luocDoGoiYMappingLichThiBangAi), controller.goiYMappingBangAi);
  router.put("/:maLichThi", xacThucYeuCau(luocDoCapNhatLichThi), controller.capNhat);
  router.delete("/:maLichThi", xacThucYeuCau(luocDoXoaLichThi), controller.xoa);

  return router;
};
