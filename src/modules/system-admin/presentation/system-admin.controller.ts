import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import { thanhCong } from "../../../shared/http/api-response.js";

const mucDoNhatKy = z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]);

const rongThanhKhongCo = (value: unknown) => (value === "" ? undefined : value);

const luocDoPhanTrangVaLocNhatKy = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  level: z.preprocess(rongThanhKhongCo, mucDoNhatKy.optional()),
  action: z.preprocess(rongThanhKhongCo, z.string().trim().min(1).max(120).optional()),
  actorId: z.preprocess(rongThanhKhongCo, z.string().uuid().optional()),
  from: z.preprocess(rongThanhKhongCo, z.coerce.date().optional()),
  to: z.preprocess(rongThanhKhongCo, z.coerce.date().optional())
});

export const luocDoXemDungLuongLuuTru = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({})
});

export const luocDoDanhSachNhatKyHeThong = z.object({
  body: z.object({}),
  params: z.object({}),
  query: luocDoPhanTrangVaLocNhatKy
});

export const luocDoDanhSachLoiHeThong = z.object({
  body: z.object({}),
  params: z.object({}),
  query: luocDoPhanTrangVaLocNhatKy.omit({ level: true })
});

export const luocDoChiTietLoiHeThong = z.object({
  body: z.object({}),
  params: z.object({
    logId: z.string().regex(/^\d+$/)
  }),
  query: z.object({})
});

type DuLieuDanhSachNhatKy = z.infer<typeof luocDoDanhSachNhatKyHeThong>;
type DuLieuDanhSachLoi = z.infer<typeof luocDoDanhSachLoiHeThong>;
type DuLieuChiTietLoi = z.infer<typeof luocDoChiTietLoiHeThong>;

export class BoDieuKhienQuanTriHeThong {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  xemDungLuongLuuTru = xuLyBatDongBo(async (req: Request, res: Response) => {
    const ketQua = await this.boPhuThuoc.xuLyXemDungLuongLuuTru.thucThi(req.user?.id ?? "");

    res.status(200).json(thanhCong(ketQua));
  });

  xemNhatKyHeThong = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { query } = req.duLieuDaXacThuc as DuLieuDanhSachNhatKy;
    const ketQua = await this.boPhuThuoc.xuLyXemNhatKyHeThong.thucThi({
      requesterId: req.user?.id ?? "",
      page: query.page,
      limit: query.limit,
      levels: query.level ? [query.level] : undefined,
      action: query.action,
      actorId: query.actorId,
      from: query.from,
      to: query.to
    });

    res.status(200).json(thanhCong(ketQua));
  });

  xemLoiHeThong = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { query } = req.duLieuDaXacThuc as DuLieuDanhSachLoi;
    const ketQua = await this.boPhuThuoc.xuLyXemLoiHeThong.thucThi({
      requesterId: req.user?.id ?? "",
      page: query.page,
      limit: query.limit,
      action: query.action,
      actorId: query.actorId,
      from: query.from,
      to: query.to
    });

    res.status(200).json(thanhCong(ketQua));
  });

  xemChiTietLoiHeThong = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { logId } = (req.duLieuDaXacThuc as DuLieuChiTietLoi).params;
    const ketQua = await this.boPhuThuoc.xuLyXemChiTietLoiHeThong.thucThi({
      actorId: req.user?.id ?? "",
      logId
    });

    res.status(200).json(thanhCong(ketQua));
  });
}
