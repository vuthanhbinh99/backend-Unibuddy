import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

export const taoBoiCanhYeuCau = (req: Request, res: Response, next: NextFunction) => {
  const maYeuCau = req.header("x-request-id") ?? randomUUID();

  req.maYeuCau = maYeuCau;
  res.setHeader("x-request-id", maYeuCau);

  next();
};



