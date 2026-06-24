import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { daTao, thanhCong } from "../../../shared/http/api-response.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import { CAC_TRANG_THAI_DEADLINE } from "../domain/deadline.js";

const maDeadline = z.string().uuid();
const maMonHoc = z.string().uuid();
const trangThaiDeadline = z.enum(CAC_TRANG_THAI_DEADLINE);

export const luocDoDanhSachDeadline = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    maMonHoc: maMonHoc.optional(),
    trangThai: trangThaiDeadline.optional()
  })
});

export const luocDoTaoDeadline = z.object({
  body: z.object({
    maMonHoc: z.string().trim().optional().nullable(),
    tieuDe: z.string().trim().optional().nullable(),
    moTa: z.string().trim().optional().nullable(),
    hanNop: z.union([z.string().trim(), z.date()]).optional().nullable()
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoCapNhatTrangThaiDeadline = z.object({
  body: z.object({
    trangThai: z.string().trim().optional().nullable()
  }),
  params: z.object({ maDeadline }),
  query: z.object({})
});

export const luocDoXoaDeadline = z.object({
  body: z.object({}),
  params: z.object({ maDeadline }),
  query: z.object({})
});

type DuLieuDanhSachDeadline = {
  query: z.infer<typeof luocDoDanhSachDeadline>["query"];
};

type DuLieuTaoDeadline = {
  body: z.infer<typeof luocDoTaoDeadline>["body"];
};

type DuLieuCapNhatTrangThaiDeadline = {
  body: z.infer<typeof luocDoCapNhatTrangThaiDeadline>["body"];
  params: {
    maDeadline: string;
  };
};

type DuLieuCoMaDeadline = {
  params: {
    maDeadline: string;
  };
};

export class BoDieuKhienDeadline {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  lietKe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { query } = req.duLieuDaXacThuc as DuLieuDanhSachDeadline;
    const ketQua = await this.boPhuThuoc.xuLyDanhSachDeadline.thucThi({
      actorId,
      maMonHoc: query.maMonHoc,
      trangThai: query.trangThai
    });

    res.status(200).json(thanhCong(ketQua));
  });

  tao = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuTaoDeadline;
    const ketQua = await this.boPhuThuoc.xuLyTaoDeadline.thucThi({
      actorId,
      ...body
    });

    res.status(201).json(daTao(ketQua));
  });

  capNhatTrangThai = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuCapNhatTrangThaiDeadline;
    const ketQua = await this.boPhuThuoc.xuLyCapNhatTrangThaiDeadline.thucThi({
      actorId,
      maDeadline: params.maDeadline,
      trangThai: body.trangThai
    });

    res.status(200).json(thanhCong(ketQua));
  });

  xoa = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { maDeadline } = (req.duLieuDaXacThuc as DuLieuCoMaDeadline).params;
    const ketQua = await this.boPhuThuoc.xuLyXoaDeadline.thucThi({ actorId, maDeadline });

    res.status(200).json(thanhCong(ketQua));
  });

  private layActorId(req: Request) {
    const actorId = req.user?.id;

    if (!actorId) {
      throw LoiUngDung.khongDuocXacThuc("Người dùng chưa đăng nhập");
    }

    return actorId;
  }
}
