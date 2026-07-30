import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { cauHinh } from "../../../shared/config/env.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import {
  BoDieuKhienTaiLieu,
  luocDoBaoCaoTaiLieu,
  luocDoDanhSachTaiLieuSinhVien,
  luocDoTomTatTaiLieuBangAi,
  luocDoUploadChiaSeTaiLieu,
  luocDoXoaTaiLieuSinhVien
} from "./document.controller.js";

const CAC_VAI_TRO_SINH_VIEN = ["SINH_VIEN"] as const;

const uploadTaiLieu = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: cauHinh.cloudinary.maxVideoBytes
  }
});

const dinhDangMb = (bytes: number) => Math.floor(bytes / (1024 * 1024));

const taiFileTaiLieu = (req: Request, res: Response, next: NextFunction) => {
  uploadTaiLieu.single("file")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(LoiUngDung.yeuCauSai(`File vượt quá dung lượng tối đa ${dinhDangMb(cauHinh.cloudinary.maxVideoBytes)}MB`));
      return;
    }

    next(LoiUngDung.yeuCauSai("Không thể tải file lên, vui lòng kiểm tra lại định dạng và dung lượng"));
  });
};

export const xayDungTuyenDuongTaiLieuSinhVien = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienTaiLieu(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(CAC_VAI_TRO_SINH_VIEN));

  router.get("/", xacThucYeuCau(luocDoDanhSachTaiLieuSinhVien), controller.lietKe);
  router.post("/", taiFileTaiLieu, xacThucYeuCau(luocDoUploadChiaSeTaiLieu), controller.uploadChiaSe);
  router.post("/ai/summarize", xacThucYeuCau(luocDoTomTatTaiLieuBangAi), controller.tomTatBangAi);
  router.delete("/:maTaiLieu", xacThucYeuCau(luocDoXoaTaiLieuSinhVien), controller.xoa);
  router.post("/:maTaiLieu/report", xacThucYeuCau(luocDoBaoCaoTaiLieu), controller.baoCao);

  return router;
};
