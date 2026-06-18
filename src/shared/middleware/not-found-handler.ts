import type { Request, Response } from "express";
import { CacLoi } from "../errors/error-codes.js";

export const xuLyKhongTimThay = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: CacLoi.NOT_FOUND,
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
};



