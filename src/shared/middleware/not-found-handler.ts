import type { Request, Response } from "express";
import { ErrorCodes } from "../errors/error-codes.js";

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCodes.NOT_FOUND,
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
};
