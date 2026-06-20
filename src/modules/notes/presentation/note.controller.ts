import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { daTao, thanhCong } from "../../../shared/http/api-response.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import type { SapXepGhiChu } from "../domain/notes.js";

const DUNG_LUONG_DINH_KEM_TOI_DA = 10 * 1024 * 1024;

const CAC_LOAI_TEP_DINH_KEM_HOP_LE = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "text/plain"
]);

const maGhiChu = z.string().uuid();
const maMonHoc = z.string().uuid();
const maTaiLieu = z.string().uuid();

const tieuDeGhiChu = z
  .string()
  .trim()
  .min(1, "Tiêu đề ghi chú không được phép để trống!")
  .max(255);

const noiDungGhiChu = z
  .string()
  .trim()
  .max(10000)
  .optional()
  .nullable()
  .transform((value) => value ?? null);

const downloadUrl = z
  .string()
  .trim()
  .url()
  .max(4096)
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  }, "Download URL phải dùng giao thức HTTP hoặc HTTPS");

const tepDinhKem = z.object({
  downloadUrl,
  tenFile: z.string().trim().min(1).max(255),
  loaiFile: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .transform((value) => value.toLowerCase())
    .refine((value) => CAC_LOAI_TEP_DINH_KEM_HOP_LE.has(value), "Tệp không hợp lệ hoặc vượt quá dung lượng"),
  dungLuong: z.coerce
    .number()
    .int()
    .positive()
    .max(DUNG_LUONG_DINH_KEM_TOI_DA, "Tệp không hợp lệ hoặc vượt quá dung lượng")
});

export const luocDoDanhSachGhiChu = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    q: z.string().trim().max(255).optional(),
    maMonHoc: maMonHoc.optional(),
    sort: z
      .enum(["updated_desc", "updated_asc", "created_desc", "created_asc", "title_asc", "title_desc"])
      .default("updated_desc"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50)
  })
});

export const luocDoChiTietGhiChu = z.object({
  body: z.object({}),
  params: z.object({ maGhiChu }),
  query: z.object({})
});

export const luocDoTaoGhiChu = z.object({
  body: z.object({
    tieuDe: tieuDeGhiChu,
    noiDung: noiDungGhiChu,
    maMonHoc: maMonHoc.optional().nullable().transform((value) => value ?? null),
    tepDinhKem: z.array(tepDinhKem).max(10).default([])
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoCapNhatGhiChu = z.object({
  body: z.object({
    tieuDe: tieuDeGhiChu,
    noiDung: noiDungGhiChu,
    maMonHoc: maMonHoc.optional().nullable().transform((value) => value ?? null),
    tepDinhKemMoi: z.array(tepDinhKem).max(10).default([]),
    maTaiLieuCanXoa: z.array(maTaiLieu).max(20).default([])
  }),
  params: z.object({ maGhiChu }),
  query: z.object({})
});

export const luocDoXoaGhiChu = z.object({
  body: z.object({}),
  params: z.object({ maGhiChu }),
  query: z.object({})
});

export const luocDoDinhKemTaiLieuGhiChu = z.object({
  body: tepDinhKem.extend({
    maGhiChu
  }),
  params: z.object({}),
  query: z.object({})
});

type DuLieuDanhSachGhiChu = {
  query: {
    q?: string;
    maMonHoc?: string;
    sort: SapXepGhiChu;
    page: number;
    limit: number;
  };
};

type DuLieuCoMaGhiChu = {
  params: {
    maGhiChu: string;
  };
};

type DuLieuTaoGhiChu = {
  body: z.infer<typeof luocDoTaoGhiChu>["body"];
};

type DuLieuCapNhatGhiChu = {
  body: z.infer<typeof luocDoCapNhatGhiChu>["body"];
  params: {
    maGhiChu: string;
  };
};

type DuLieuDinhKemTaiLieuGhiChu = {
  body: z.infer<typeof luocDoDinhKemTaiLieuGhiChu>["body"];
};

export class BoDieuKhienGhiChu {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  lietKe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { query } = req.duLieuDaXacThuc as DuLieuDanhSachGhiChu;
    const ketQua = await this.boPhuThuoc.xuLyDanhSachGhiChu.thucThi({
      actorId,
      tuKhoa: query.q || undefined,
      maMonHoc: query.maMonHoc,
      sort: query.sort,
      page: query.page,
      limit: query.limit
    });

    res.status(200).json(thanhCong(ketQua));
  });

  chiTiet = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { maGhiChu } = (req.duLieuDaXacThuc as DuLieuCoMaGhiChu).params;
    const ketQua = await this.boPhuThuoc.xuLyLayChiTietGhiChu.thucThi(actorId, maGhiChu);

    res.status(200).json(thanhCong(ketQua));
  });

  tao = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuTaoGhiChu;
    const ketQua = await this.boPhuThuoc.xuLyTaoGhiChu.thucThi({
      actorId,
      tieuDe: body.tieuDe,
      noiDung: body.noiDung,
      maMonHoc: body.maMonHoc,
      tepDinhKem: body.tepDinhKem
    });

    res.status(201).json(daTao(ketQua));
  });

  capNhat = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuCapNhatGhiChu;
    const ketQua = await this.boPhuThuoc.xuLyCapNhatGhiChu.thucThi({
      actorId,
      maGhiChu: params.maGhiChu,
      tieuDe: body.tieuDe,
      noiDung: body.noiDung,
      maMonHoc: body.maMonHoc,
      tepDinhKem: body.tepDinhKemMoi,
      maTaiLieuCanXoa: body.maTaiLieuCanXoa
    });

    res.status(200).json(thanhCong(ketQua));
  });

  xoa = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { maGhiChu } = (req.duLieuDaXacThuc as DuLieuCoMaGhiChu).params;
    const ketQua = await this.boPhuThuoc.xuLyXoaGhiChu.thucThi({ actorId, maGhiChu });

    res.status(200).json(thanhCong(ketQua));
  });

  dinhKemTaiLieu = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuDinhKemTaiLieuGhiChu;
    const ketQua = await this.boPhuThuoc.xuLyDinhKemTaiLieuGhiChu.thucThi({
      actorId,
      maGhiChu: body.maGhiChu,
      downloadUrl: body.downloadUrl,
      tenFile: body.tenFile,
      loaiFile: body.loaiFile,
      dungLuong: body.dungLuong
    });

    res.status(201).json(daTao(ketQua));
  });

  private layActorId(req: Request) {
    const actorId = req.user?.id;

    if (!actorId) {
      throw LoiUngDung.khongDuocXacThuc("Người dùng chưa đăng nhập");
    }

    return actorId;
  }
}
