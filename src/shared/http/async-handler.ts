import type { NextFunction, Request, Response } from "express";

type TuyenXuLyBatDongBo = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const xuLyBatDongBo =
  (tuyenXuLy: TuyenXuLyBatDongBo) => (req: Request, res: Response, next: NextFunction) => {
    void tuyenXuLy(req, res, next).catch(next);
  };



