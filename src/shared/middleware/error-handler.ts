import type { ErrorRequestHandler } from "express";
import { LoiUngDung } from "../errors/app-error.js";
import { CacLoi } from "../errors/error-codes.js";
import { nhatKy } from "../logger/logger.js";

export const xuLyLoi: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof LoiUngDung) {
    res.status(error.maTrangThai).json({
      success: false,
      error: {
        code: error.maLoi,
        message: error.message,
        details: error.chiTiet
      }
    });
    return;
  }

  nhatKy.error("Unhandled error", {
    maYeuCau: req.maYeuCau,
    error
  });

  res.status(500).json({
    success: false,
    error: {
      code: CacLoi.INTERNAL_ERROR,
      message: "Internal server error"
    }
  });
};
