import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import { thanhCong } from "../../../shared/http/api-response.js";

const luocDoMaTruongCode = z.string().trim().min(1).transform((value) => value.toUpperCase());

const luocDoMucThangDiem = z.object({
  thuTu: z.number().int(),
  diemTu: z.number(),
  diemDen: z.number(),
  diemChu: z.string().trim().min(1),
  he4: z.number()
});

const luocDoQuyCheHocLuc = z.object({
  thuTu: z.number().int(),
  xepLoai: z.string().trim().min(1),
  gpaTu: z.number(),
  gpaDen: z.number()
});

export const luocDoLayCauHinhHocThuat = z.object({
  body: z.object({}),
  params: z.object({ maTruongCode: luocDoMaTruongCode }),
  query: z.object({})
});

export const luocDoCapNhatThangDiem = z.object({
  body: z.object({
    mucThangDiem: z.array(luocDoMucThangDiem).min(1)
  }),
  params: z.object({ maTruongCode: luocDoMaTruongCode }),
  query: z.object({})
});

export const luocDoCapNhatQuyCheHocLuc = z.object({
  body: z.object({
    quyCheHocLuc: z.array(luocDoQuyCheHocLuc).min(1)
  }),
  params: z.object({ maTruongCode: luocDoMaTruongCode }),
  query: z.object({})
});

type DuLieuCoMaTruongCode = {
  params: {
    maTruongCode: string;
  };
};

type DuLieuCapNhatThangDiem = {
  body: {
    mucThangDiem: Array<{
      thuTu: number;
      diemTu: number;
      diemDen: number;
      diemChu: string;
      he4: number;
    }>;
  };
};

type DuLieuCapNhatQuyCheHocLuc = {
  body: {
    quyCheHocLuc: Array<{
      thuTu: number;
      xepLoai: string;
      gpaTu: number;
      gpaDen: number;
    }>;
  };
};

export class BoDieuKhienHocThuatTruongHoc {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  layCauHinh = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { maTruongCode } = (req.duLieuDaXacThuc as DuLieuCoMaTruongCode).params;
    const cauHinh = await this.boPhuThuoc.xuLyLayCauHinhHocThuatTruongHoc.thucThi(maTruongCode);

    res.status(200).json(thanhCong(cauHinh));
  });

  capNhatThangDiem = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { maTruongCode } = (req.duLieuDaXacThuc as DuLieuCoMaTruongCode).params;
    const body = (req.duLieuDaXacThuc as DuLieuCapNhatThangDiem).body;

    const cauHinh = await this.boPhuThuoc.xuLyCapNhatThangDiemTruongHoc.thucThi({
      actorId: req.user?.id ?? null,
      maTruongCode,
      mucThangDiem: body.mucThangDiem
    });

    res.status(200).json(thanhCong(cauHinh));
  });

  capNhatQuyCheHocLuc = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { maTruongCode } = (req.duLieuDaXacThuc as DuLieuCoMaTruongCode).params;
    const body = (req.duLieuDaXacThuc as DuLieuCapNhatQuyCheHocLuc).body;

    const cauHinh = await this.boPhuThuoc.xuLyCapNhatQuyCheHocLucTruongHoc.thucThi({
      actorId: req.user?.id ?? null,
      maTruongCode,
      quyCheHocLuc: body.quyCheHocLuc
    });

    res.status(200).json(thanhCong(cauHinh));
  });
}
