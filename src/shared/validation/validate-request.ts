import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject, ZodError } from "zod";
import { LoiUngDung } from "../errors/app-error.js";

const dinhDangLoiZod = (error: ZodError) =>
  error.errors.map((item) => ({
    path: item.path.join("."),
    message: item.message
  }));

export const xacThucYeuCau =
  (luocDo: AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const ketQua = luocDo.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!ketQua.success) {
      next(LoiUngDung.yeuCauSai("Invalid request data", dinhDangLoiZod(ketQua.error)));
      return;
    }

    req.duLieuDaXacThuc = ketQua.data;
    next();
  };



