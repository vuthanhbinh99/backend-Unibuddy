import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { ErrorCodes } from "../errors/error-codes.js";
import { logger } from "../logger/logger.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    return;
  }

  logger.error("Unhandled error", {
    requestId: req.requestId,
    error
  });

  res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: "Internal server error"
    }
  });
};
