import type { Request, Response } from "express";
import type { BoPhuThuocUngDung } from "../../container.js";
import { xuLyBatDongBo } from "../../shared/http/async-handler.js";
import { thanhCong } from "../../shared/http/api-response.js";

export class BoDieuKhienSucKhoe {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  hienThi = xuLyBatDongBo(async (_req: Request, res: Response) => {
    await this.boPhuThuoc.coSoDuLieu.truyVan("SELECT 1");

    res.status(200).json(
      thanhCong({
        status: "ok",
        database: "reachable"
      })
    );
  });
}



