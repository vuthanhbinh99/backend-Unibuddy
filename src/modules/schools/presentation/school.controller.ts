import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import { daTao, thanhCong } from "../../../shared/http/api-response.js";

const luocDoMaTruongCode = z.string().trim().min(1).transform((value) => value.toUpperCase());

export const luocDoDanhSachTruongHoc = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({})
});

export const luocDoChiTietTruongHoc = z.object({
  body: z.object({}),
  params: z.object({
    maTruongCode: luocDoMaTruongCode
  }),
  query: z.object({})
});

export const luocDoTaoTruongHoc = z.object({
  body: z.object({
    maTruongCode: luocDoMaTruongCode,
    tenTruong: z.string().trim().min(1)
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoCapNhatTruongHoc = z.object({
  body: z.object({
    tenTruong: z.string().trim().min(1)
  }),
  params: z.object({
    maTruongCode: luocDoMaTruongCode
  }),
  query: z.object({})
});

export const luocDoXoaTruongHoc = z.object({
  body: z.object({}),
  params: z.object({
    maTruongCode: luocDoMaTruongCode
  }),
  query: z.object({})
});

type DuLieuCoMaTruongCode = {
  params: {
    maTruongCode: string;
  };
};

type DuLieuTaoTruongHoc = {
  body: {
    maTruongCode: string;
    tenTruong: string;
  };
};

type DuLieuCapNhatTruongHoc = {
  body: {
    tenTruong: string;
  };
};

export class BoDieuKhienTruongHoc {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  lietKe = xuLyBatDongBo(async (_req: Request, res: Response) => {
    const danhSachTruongHoc = await this.boPhuThuoc.xuLyDanhSachTruongHoc.thucThi();
    res.status(200).json(thanhCong(danhSachTruongHoc));
  });

  chiTiet = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { maTruongCode } = (req.duLieuDaXacThuc as DuLieuCoMaTruongCode).params;
    const truongHoc = await this.boPhuThuoc.xuLyLayChiTietTruongHoc.thucThi(maTruongCode);

    res.status(200).json(thanhCong(truongHoc));
  });

  tao = xuLyBatDongBo(async (req: Request, res: Response) => {
    const body = (req.duLieuDaXacThuc as DuLieuTaoTruongHoc).body;
    const truongHoc = await this.boPhuThuoc.xuLyTaoTruongHoc.thucThi({
      actorId: req.user?.id ?? null,
      maTruongCode: body.maTruongCode,
      tenTruong: body.tenTruong
    });

    res.status(201).json(daTao(truongHoc));
  });

  capNhat = xuLyBatDongBo(async (req: Request, res: Response) => {
    const params = (req.duLieuDaXacThuc as DuLieuCoMaTruongCode).params;
    const body = (req.duLieuDaXacThuc as DuLieuCapNhatTruongHoc).body;

    const truongHoc = await this.boPhuThuoc.xuLyCapNhatTruongHoc.thucThi({
      actorId: req.user?.id ?? null,
      maTruongCode: params.maTruongCode,
      tenTruong: body.tenTruong
    });

    res.status(200).json(thanhCong(truongHoc));
  });

  xoa = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { maTruongCode } = (req.duLieuDaXacThuc as DuLieuCoMaTruongCode).params;

    const ketQua = await this.boPhuThuoc.xuLyXoaTruongHoc.thucThi({
      actorId: req.user?.id ?? null,
      maTruongCode
    });

    res.status(200).json(thanhCong(ketQua));
  });
}
