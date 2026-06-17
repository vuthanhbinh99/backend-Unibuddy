import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject, ZodError } from "zod";
import { AppError } from "../errors/app-error.js";

const formatZodError = (error: ZodError) =>
  error.errors.map((item) => ({
    path: item.path.join("."),
    message: item.message
  }));

export const validateRequest =
  (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      next(AppError.badRequest("Invalid request data", formatZodError(result.error)));
      return;
    }

    req.validated = result.data;
    next();
  };
