import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { xacThucYeuCau } from "../../../shared/validation/validate-request.js";
import { BoTrungGianXacThuc } from "../../auth/presentation/auth.middleware.js";
import {
  BoDieuKhienFlashcard,
  luocDoBatDauOnTapFlashcard,
  luocDoCapNhatBoFlashcard,
  luocDoDanhSachBoFlashcard,
  luocDoGhiKetQuaPhienFlashcard,
  luocDoTaoBoFlashcard,
  luocDoTaoTheFlashcardBangAi,
  luocDoTaoTheFlashcard,
  luocDoXoaBoFlashcard
} from "./flashcard.controller.js";

const SINH_VIEN = ["SINH_VIEN"] as const;
const DUNG_LUONG_FILE_IMPORT_TOI_DA = 5 * 1024 * 1024;

const uploadImport = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: DUNG_LUONG_FILE_IMPORT_TOI_DA
  }
});

const ghiCanhBaoTaiFile = async (
  boPhuThuoc: BoPhuThuocUngDung,
  req: Request,
  message: string,
  action = "FLASHCARD_IMPORT_UPLOAD_FAILED"
) => {
  try {
    await boPhuThuoc.khoNhatKyHeThong.tao({
      actorId: req.user?.id ?? null,
      level: "WARNING",
      action,
      tableName: "flashcard",
      recordId: req.params.maBo,
      message,
      metadata: {
        maBo: req.params.maBo,
        fileField: "file"
      }
    });
  } catch {
    // Route middleware must still return the upload validation error to the client.
  }
};

const taiFileImportFlashcard =
  (boPhuThuoc: BoPhuThuocUngDung, action: string, messageQuaLon: string, messageLoi: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    uploadImport.single("file")(req, res, (error: unknown) => {
      if (!error) {
        next();
        return;
      }

      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        void ghiCanhBaoTaiFile(boPhuThuoc, req, messageQuaLon, action);
        next(LoiUngDung.yeuCauSai("File vượt quá dung lượng tối đa 5MB"));
        return;
      }

      void ghiCanhBaoTaiFile(boPhuThuoc, req, messageLoi, action);
      next(LoiUngDung.yeuCauSai("Không thể tải file lên, vui lòng kiểm tra lại định dạng và dung lượng"));
    });
  };

export const xayDungTuyenDuongBoFlashcard = (boPhuThuoc: BoPhuThuocUngDung) => {
  const router = Router();
  const controller = new BoDieuKhienFlashcard(boPhuThuoc);
  const auth = new BoTrungGianXacThuc(boPhuThuoc);

  router.use(auth.yeuCauVaiTro(SINH_VIEN));

  router.get("/", xacThucYeuCau(luocDoDanhSachBoFlashcard), controller.lietKeBo);
  router.post("/", xacThucYeuCau(luocDoTaoBoFlashcard), controller.taoBo);
  router.put("/:maBo", xacThucYeuCau(luocDoCapNhatBoFlashcard), controller.capNhatBo);
  router.delete("/:maBo", xacThucYeuCau(luocDoXoaBoFlashcard), controller.xoaBo);
  router.post("/:maBo/flashcards", xacThucYeuCau(luocDoTaoTheFlashcard), controller.taoThe);
  router.post(
    "/:maBo/flashcards/import",
    taiFileImportFlashcard(
      boPhuThuoc,
      "FLASHCARD_IMPORT_UPLOAD_FAILED",
      "Nhập thẻ từ file thất bại - File vượt quá 5MB",
      "Nhập thẻ từ file thất bại - Không thể tải file lên backend"
    ),
    controller.importThe
  );
  router.post("/:maBo/flashcards/ai-generate", xacThucYeuCau(luocDoTaoTheFlashcardBangAi), controller.taoTheBangAi);
  router.post(
    "/:maBo/flashcards/ai-import",
    taiFileImportFlashcard(
      boPhuThuoc,
      "FLASHCARD_AI_IMPORT_UPLOAD_FAILED",
      "Tạo thẻ AI từ file thất bại - File vượt quá 5MB",
      "Tạo thẻ AI từ file thất bại - Không thể tải file lên backend"
    ),
    controller.aiImportThe
  );
  router.post(
    "/:maBo/flashcards/ai-import-tu-luan",
    taiFileImportFlashcard(
      boPhuThuoc,
      "FLASHCARD_AI_ESSAY_IMPORT_UPLOAD_FAILED",
      "Tạo thẻ tự luận AI từ file thất bại - File vượt quá 5MB",
      "Tạo thẻ tự luận AI từ file thất bại - Không thể tải file lên backend"
    ),
    controller.aiImportTheTuLuan
  );
  router.get("/:maBo/review", xacThucYeuCau(luocDoBatDauOnTapFlashcard), controller.batDauOnTap);
  router.post(
    "/:maBo/session-result",
    xacThucYeuCau(luocDoGhiKetQuaPhienFlashcard),
    controller.ghiKetQuaPhien
  );

  return router;
};
