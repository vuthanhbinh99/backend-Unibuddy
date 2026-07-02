import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { cauHinh } from "../../../shared/config/env.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import {
  BoDieuKhienNguoiDung,
  luocDoCapNhatThongTinNguoiDungHienTai,
  luocDoGuiPhanHoiNguoiDungHienTai
} from "./user.controller.js";

const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: cauHinh.cloudinary.maxAvatarBytes
  }
});

const uploadFeedback = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: cauHinh.cloudinary.maxAvatarBytes
  }
});

const CAC_LOAI_ANH_PHAN_HOI = new Set(["image/png", "image/jpeg", "image/webp"]);

const dinhDangMb = (bytes: number) => Math.floor(bytes / (1024 * 1024));

const taiAnhDaiDien = (req: Request, res: Response, next: NextFunction) => {
  uploadAvatar.single("file")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(LoiUngDung.yeuCauSai(`Anh dai dien vuot qua dung luong toi da ${dinhDangMb(cauHinh.cloudinary.maxAvatarBytes)}MB`));
      return;
    }

    next(LoiUngDung.yeuCauSai("Khong the tai anh dai dien len"));
  });
};

const taiAnhPhanHoi = (req: Request, res: Response, next: NextFunction) => {
  if (!req.is("multipart/form-data")) {
    next();
    return;
  }

  uploadFeedback.single("file")(req, res, (error: unknown) => {
    if (!error) {
      const file = req.file;
      if (file && !CAC_LOAI_ANH_PHAN_HOI.has(file.mimetype)) {
        next(LoiUngDung.yeuCauSai("Phản hồi chỉ hô trợ ảnh PNG, JPG hoặc WebP"));
        return;
      }

      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(LoiUngDung.yeuCauSai(`Ảnh phản hồi vượt quá dung lượng tối đa ${dinhDangMb(cauHinh.cloudinary.maxAvatarBytes)}MB`));
      return;
    }

    next(LoiUngDung.yeuCauSai("Không thể tải ảnh phản hồi lên"));
  });
};

export const xayDungTuyenDuongNguoiDung = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienNguoiDung(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.get("/me", auth.yeuCauXacThuc, controller.thongTinCuaToi);
  router.patch("/me", auth.yeuCauXacThuc, xacThucYeuCau(luocDoCapNhatThongTinNguoiDungHienTai), controller.capNhatThongTinCuaToi);
  router.post(
    "/me/feedback",
    auth.yeuCauVaiTro(["SINH_VIEN"]),
    taiAnhPhanHoi,
    xacThucYeuCau(luocDoGuiPhanHoiNguoiDungHienTai),
    controller.guiPhanHoiCuaToi
  );
  router.post("/me/avatar", auth.yeuCauXacThuc, taiAnhDaiDien, controller.capNhatAnhDaiDien);

  return router;
};



