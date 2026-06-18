import type { Request, Response } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import { thanhCong } from "../../../shared/http/api-response.js";

export class BoDieuKhienNguoiDung {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  thongTinCuaToi = xuLyBatDongBo(async (req: Request, res: Response) => {
    if (!req.user) {
      throw LoiUngDung.khongDuocXacThuc();
    }

    const user = await this.boPhuThuoc.xuLyLayNguoiDungHienTai.thucThi(req.user.id);
    res.status(200).json(thanhCong(user));
  });
}



