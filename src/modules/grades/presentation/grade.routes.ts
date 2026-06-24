import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import { taoChiTietImportDiemThatBaiChoNhapThuCong } from "../application/services/grade-import-manual-fallback.service.js";
import {
  BoDieuKhienDiemSo,
  luocDoCapNhatThanhPhanDiem,
  luocDoCauHinhTrongSo,
  luocDoDuPhongGpa,
  luocDoPreviewImportDiemSo,
  luocDoTaoThanhPhanDiem,
  luocDoXacNhanImportDiemSo,
  luocDoXemBangDiem
} from "./grade.controller.js";

const SINH_VIEN = ["SINH_VIEN"] as const;
const DUNG_LUONG_FILE_IMPORT_TOI_DA = 10 * 1024 * 1024;

const uploadImport = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: DUNG_LUONG_FILE_IMPORT_TOI_DA
  }
});

const taiFileImportDiemSo = (req: Request, res: Response, next: NextFunction) => {
  uploadImport.single("file")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(
        LoiUngDung.yeuCauSai(
          "File điểm số vượt quá dung lượng tối đa 10MB",
          taoChiTietImportDiemThatBaiChoNhapThuCong("UPLOAD_FILE", { reasonCode: "FILE_TOO_LARGE" })
        )
      );
      return;
    }

    next(
      LoiUngDung.yeuCauSai(
        "Không thể tải file điểm số, vui lòng kiểm tra lại định dạng và dung lượng",
        taoChiTietImportDiemThatBaiChoNhapThuCong("UPLOAD_FILE")
      )
    );
  });
};

export const xayDungTuyenDuongDiemSo = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienDiemSo(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(SINH_VIEN));

  router.get("/bang-diem", xacThucYeuCau(luocDoXemBangDiem), controller.xemBangDiem);
  router.post("/", xacThucYeuCau(luocDoTaoThanhPhanDiem), controller.taoThanhPhanDiem);
  router.post("/trong-so", xacThucYeuCau(luocDoCauHinhTrongSo), controller.cauHinhTrongSo);
  router.post("/du-phong", xacThucYeuCau(luocDoDuPhongGpa), controller.duPhongGpa);
  router.post("/import/headers", taiFileImportDiemSo, controller.trichXuatHeaderImport);
  router.post("/import/preview", xacThucYeuCau(luocDoPreviewImportDiemSo), controller.previewImport);
  router.post("/import/confirm", xacThucYeuCau(luocDoXacNhanImportDiemSo), controller.xacNhanImport);
  router.put("/:maThanhPhan", xacThucYeuCau(luocDoCapNhatThanhPhanDiem), controller.capNhatThanhPhanDiem);

  return router;
};
