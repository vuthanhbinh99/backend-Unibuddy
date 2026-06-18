import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import { thanhCong } from "../../../shared/http/api-response.js";

const trangThaiBaoCao = z.enum(["CHO_XU_LY", "DA_DUYET", "DA_TU_CHOI"]);
const maBaoCao = z.string().trim().min(1);

export const luocDoDanhSachBaoCaoTaiLieu = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    trangThai: trangThaiBaoCao.optional()
  })
});

export const luocDoChiTietBaoCaoTaiLieu = z.object({
  body: z.object({}),
  params: z.object({ maBaoCao }),
  query: z.object({})
});

export const luocDoDuyetBaoCaoTaiLieu = z.object({
  body: z.object({}),
  params: z.object({ maBaoCao }),
  query: z.object({})
});

export const luocDoTuChoiBaoCaoTaiLieu = z.object({
  body: z.object({}),
  params: z.object({ maBaoCao }),
  query: z.object({})
});

type DuLieuCoMaBaoCao = {
  params: {
    maBaoCao: string;
  };
};

type DuLieuDanhSach = {
  query: {
    trangThai?: "CHO_XU_LY" | "DA_DUYET" | "DA_TU_CHOI";
  };
};

export class BoDieuKhienBaoCaoTaiLieu {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  lietKe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const query = req.duLieuDaXacThuc as DuLieuDanhSach;
    const danhSach = await this.boPhuThuoc.xuLyDanhSachBaoCaoTaiLieu.thucThi(query.query.trangThai);

    res.status(200).json(thanhCong(danhSach));
  });

  chiTiet = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { maBaoCao } = (req.duLieuDaXacThuc as DuLieuCoMaBaoCao).params;
    const baoCao = await this.boPhuThuoc.xuLyLayChiTietBaoCaoTaiLieu.thucThi(maBaoCao);

    res.status(200).json(thanhCong(baoCao));
  });

  duyet = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { maBaoCao } = (req.duLieuDaXacThuc as DuLieuCoMaBaoCao).params;
    const ketQua = await this.boPhuThuoc.xuLyDuyetBaoCaoTaiLieu.thucThi({
      actorId: req.user?.id ?? null,
      maBaoCao
    });

    res.status(200).json(thanhCong(ketQua));
  });

  tuChoi = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { maBaoCao } = (req.duLieuDaXacThuc as DuLieuCoMaBaoCao).params;
    const ketQua = await this.boPhuThuoc.xuLyTuChoiBaoCaoTaiLieu.thucThi({
      actorId: req.user?.id ?? null,
      maBaoCao
    });

    res.status(200).json(thanhCong(ketQua));
  });
}
