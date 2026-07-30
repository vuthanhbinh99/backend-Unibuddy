import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { daTao, thanhCong } from "../../../shared/http/api-response.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";

const maLichThi = z.string().uuid();
const maMonHoc = z.string().uuid();
const maHocKy = z.string().uuid();
const dongImport = z.record(z.unknown());

const lichThiBody = z.object({
  maMonHoc,
  thoiGianThi: z.coerce.date(),
  phongThi: z.string().trim().max(100).optional().nullable().transform((value) => value || null),
  diaDiemThi: z.string().trim().max(255).optional().nullable().transform((value) => value || null)
});

const taoLichThiBody = lichThiBody.extend({
  replaceExistingExam: z.coerce.boolean().optional().default(false)
});

const mappingImport = z.object({
  maMonHoc: z.string().trim().min(1).optional(),
  maMon: z.string().trim().min(1).optional(),
  tenMon: z.string().trim().min(1).optional(),
  thoiGianThi: z.string().trim().min(1).optional(),
  ngayThi: z.string().trim().min(1).optional(),
  gioBatDau: z.string().trim().min(1).optional(),
  phongThi: z.string().trim().min(1).optional(),
  diaDiemThi: z.string().trim().min(1).optional()
});

const itemImportDaChuanHoa = z.object({
  rowIndex: z.coerce.number().int().positive(),
  maMonHoc,
  maMon: z.string().trim().nullable().default(null),
  tenMon: z.string().trim().min(1),
  thoiGianThi: z.coerce.date(),
  phongThi: z.string().trim().nullable().default(null),
  diaDiemThi: z.string().trim().nullable().default(null)
});

export const luocDoDanhSachLichThi = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    maMonHoc: maMonHoc.optional()
  })
});

export const luocDoTaoLichThi = z.object({
  body: taoLichThiBody,
  params: z.object({}),
  query: z.object({})
});

export const luocDoCapNhatLichThi = z.object({
  body: lichThiBody,
  params: z.object({ maLichThi }),
  query: z.object({})
});

export const luocDoXoaLichThi = z.object({
  body: z.object({}),
  params: z.object({ maLichThi }),
  query: z.object({})
});

export const luocDoPreviewImportLichThi = z.object({
  body: z.object({
    maHocKy: maHocKy.optional().nullable().transform((value) => value ?? null),
    rows: z.array(dongImport).max(1000).default([]),
    mapping: mappingImport.default({})
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoXacNhanImportLichThi = z.object({
  body: z.object({
    items: z.array(itemImportDaChuanHoa).min(1).max(1000),
    replaceExistingExams: z.coerce.boolean().optional().default(false)
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoGoiYMappingLichThiBangAi = z.object({
  body: z.object({
    headers: z.array(z.string().trim().min(1)).min(2).max(500),
    sampleRows: z.array(dongImport).min(1).max(20)
  }),
  params: z.object({}),
  query: z.object({})
});

type DuLieuDanhSach = {
  query: {
    maMonHoc?: string;
  };
};

type DuLieuTao = {
  body: z.infer<typeof luocDoTaoLichThi>["body"];
};

type DuLieuCapNhat = {
  body: z.infer<typeof luocDoCapNhatLichThi>["body"];
  params: {
    maLichThi: string;
  };
};

type DuLieuCoMaLichThi = {
  params: {
    maLichThi: string;
  };
};

type DuLieuPreviewImport = {
  body: z.infer<typeof luocDoPreviewImportLichThi>["body"];
};

type DuLieuXacNhanImport = {
  body: z.infer<typeof luocDoXacNhanImportLichThi>["body"];
};

type DuLieuGoiYMapping = {
  body: z.infer<typeof luocDoGoiYMappingLichThiBangAi>["body"];
};

const chuanHoaMaHocKy = (value?: string | null) => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class BoDieuKhienLichThi {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  lietKe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { query } = req.duLieuDaXacThuc as DuLieuDanhSach;
    const ketQua = await this.boPhuThuoc.xuLyDanhSachLichThi.thucThi({
      actorId,
      maMonHoc: query.maMonHoc
    });

    res.status(200).json(thanhCong(ketQua));
  });

  tao = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuTao;
    const ketQua = await this.boPhuThuoc.xuLyTaoLichThi.thucThi({ actorId, ...body });

    res.status(201).json(daTao(ketQua));
  });

  capNhat = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuCapNhat;
    const ketQua = await this.boPhuThuoc.xuLyCapNhatLichThi.thucThi({
      actorId,
      maLichThi: params.maLichThi,
      ...body
    });

    res.status(200).json(thanhCong(ketQua));
  });

  xoa = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { maLichThi } = (req.duLieuDaXacThuc as DuLieuCoMaLichThi).params;
    const ketQua = await this.boPhuThuoc.xuLyXoaLichThi.thucThi({ actorId, maLichThi });

    res.status(200).json(thanhCong(ketQua));
  });

  trichXuatHeaderImport = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const file = req.file;

    if (!file) {
      throw LoiUngDung.yeuCauSai("Vui lòng tải lên file lịch thi");
    }

    const ketQua = await this.boPhuThuoc.xuLyTrichXuatHeaderImportLichThi.thucThi({
      actorId,
      buffer: file.buffer,
      tenFile: file.originalname,
      mimeType: file.mimetype
    });

    res.status(200).json(thanhCong(ketQua));
  });

  previewImport = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuPreviewImport;
    const ketQua = await this.boPhuThuoc.xuLyPreviewImportLichThi.thucThi({
      actorId,
      maHocKy: chuanHoaMaHocKy(body.maHocKy),
      rows: body.rows,
      mapping: body.mapping
    });

    res.status(200).json(thanhCong(ketQua));
  });

  xacNhanImport = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuXacNhanImport;
    const ketQua = await this.boPhuThuoc.xuLyXacNhanImportLichThi.thucThi({
      actorId,
      items: body.items,
      replaceExistingExams: body.replaceExistingExams
    });

    res.status(200).json(thanhCong(ketQua));
  });

  goiYMappingBangAi = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuGoiYMapping;
    const ketQua = await this.boPhuThuoc.xuLyGoiYMappingImportLichThiBangAi.thucThi({
      actorId,
      headers: body.headers,
      sampleRows: body.sampleRows
    });

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
