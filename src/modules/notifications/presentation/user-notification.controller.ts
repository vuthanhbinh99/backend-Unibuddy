import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { thanhCong } from "../../../shared/http/api-response.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";

const loaiThongBaoNguoiDung = z.enum(["HE_THONG", "NHOM_HOC_TAP", "DEADLINE"]);

export const luocDoDanhSachThongBaoNguoiDung = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    status: z.enum(["all", "unread"]).optional().default("all"),
    loaiThongBao: loaiThongBaoNguoiDung.optional().nullable().transform((value) => value ?? null),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50)
  })
});

export const luocDoDanhDauDaDocThongBao = z.object({
  body: z.object({}),
  params: z.object({
    maThongBao: z.string().uuid()
  }),
  query: z.object({})
});

export const luocDoDanhDauTatCaDaDocThongBao = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({})
});

type DuLieuDanhSachThongBao = z.infer<typeof luocDoDanhSachThongBaoNguoiDung>;
type DuLieuDanhDauDaDoc = z.infer<typeof luocDoDanhDauDaDocThongBao>;

export class BoDieuKhienThongBaoNguoiDung {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  lietKe = xuLyBatDongBo(async (req: Request, res: Response) => {
    if (!req.user) {
      throw LoiUngDung.khongDuocXacThuc();
    }

    const { query } = req.duLieuDaXacThuc as DuLieuDanhSachThongBao;
    const ketQua = await this.boPhuThuoc.xuLyDanhSachThongBaoNguoiDung.thucThi({
      userId: req.user.id,
      onlyUnread: query.status === "unread",
      loaiThongBao: query.loaiThongBao,
      page: query.page,
      limit: query.limit
    });

    res.status(200).json(thanhCong(ketQua));
  });

  danhDauDaDoc = xuLyBatDongBo(async (req: Request, res: Response) => {
    if (!req.user) {
      throw LoiUngDung.khongDuocXacThuc();
    }

    const { params } = req.duLieuDaXacThuc as DuLieuDanhDauDaDoc;
    const ketQua = await this.boPhuThuoc.xuLyDanhDauDaDocThongBao.thucThi({
      userId: req.user.id,
      maThongBao: params.maThongBao
    });

    res.status(200).json(thanhCong(ketQua));
  });

  danhDauTatCaDaDoc = xuLyBatDongBo(async (req: Request, res: Response) => {
    if (!req.user) {
      throw LoiUngDung.khongDuocXacThuc();
    }

    const ketQua = await this.boPhuThuoc.xuLyDanhDauTatCaDaDocThongBao.thucThi({
      userId: req.user.id
    });

    res.status(200).json(thanhCong(ketQua));
  });
}
