import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { daTao, thanhCong } from "../../../shared/http/api-response.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import { taoChiTietImportThatBaiChoNhapThuCong } from "../application/services/schedule-manual-entry-fallback.service.js";

const maLichHoc = z.string().uuid();
const maMonHoc = z.string().uuid();
const maHocKy = z.string().uuid();

const ngayIso = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có định dạng YYYY-MM-DD")
  .optional()
  .nullable()
  .transform((value) => value ?? null);

const lichHocBodyBase = z.object({
  maMonHoc,
  thu: z.coerce.number().int().min(2).max(8),
  tietBatDau: z.coerce.number().int().min(1).max(12),
  soTiet: z.coerce.number().int().positive().max(12),
  phongHoc: z.string().trim().max(100).optional().nullable().transform((value) => value || null),
  ngayBatDau: ngayIso,
  ngayKetThuc: ngayIso
});

type DuLieuKhoangLichHoc = {
  tietBatDau: number;
  soTiet: number;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
};

const kiemTraKhoangLichHoc = (data: DuLieuKhoangLichHoc, ctx: z.RefinementCtx) => {
  if (data.tietBatDau + data.soTiet - 1 > 12) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["soTiet"],
      message: "Khoảng tiết học vượt quá tiết 12"
    });
  }

  if (data.ngayBatDau && data.ngayKetThuc && data.ngayBatDau > data.ngayKetThuc) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ngayKetThuc"],
      message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu"
    });
  }
};

const lichHocBody = lichHocBodyBase.superRefine(kiemTraKhoangLichHoc);

const dongImport = z.record(z.unknown());

const mappingImport = z.object({
  maMonHoc: z.string().trim().min(1).optional(),
  maMon: z.string().trim().min(1).optional(),
  tenMon: z.string().trim().min(1).optional(),
  thu: z.string().trim().min(1).optional(),
  tietBatDau: z.string().trim().min(1).optional(),
  soTiet: z.string().trim().min(1).optional(),
  soTinChi: z.string().trim().min(1).optional(),
  phongHoc: z.string().trim().min(1).optional(),
  ngayBatDau: z.string().trim().min(1).optional(),
  ngayKetThuc: z.string().trim().min(1).optional()
});

const itemImportDaChuanHoa = lichHocBodyBase
  .omit({
    maMonHoc: true
  })
  .extend({
    maMonHoc: maMonHoc.optional().nullable().default(null),
    rowIndex: z.coerce.number().int().positive(),
    maMon: z.string().trim().nullable().default(null),
    tenMon: z.string().trim().min(1),
    soTinChi: z.coerce.number().int().positive().optional().nullable().default(null),
    tuDongTaoMonHoc: z.coerce.boolean().optional().default(false)
  })
  .superRefine(kiemTraKhoangLichHoc);

export const luocDoDanhSachLichHoc = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    maMonHoc: maMonHoc.optional()
  })
});

export const luocDoTaoLichHoc = z.object({
  body: lichHocBody,
  params: z.object({}),
  query: z.object({})
});

export const luocDoCapNhatLichHoc = z.object({
  body: lichHocBody,
  params: z.object({ maLichHoc }),
  query: z.object({})
});

export const luocDoXoaLichHoc = z.object({
  body: z.object({}),
  params: z.object({ maLichHoc }),
  query: z.object({})
});

export const luocDoPreviewImportThoiKhoaBieu = z.object({
  body: z.object({
    maHocKy: maHocKy.optional().nullable().transform((value) => value ?? null),
    rows: z.array(dongImport).max(1000).default([]),
    mapping: mappingImport.default({})
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoXacNhanImportThoiKhoaBieu = z.object({
  body: z.object({
    maHocKy: maHocKy.optional().nullable().transform((value) => value ?? null),
    items: z.array(itemImportDaChuanHoa).min(1).max(1000)
  }),
  params: z.object({}),
  query: z.object({})
});

type DuLieuDanhSachLichHoc = {
  query: {
    maMonHoc?: string;
  };
};

type DuLieuTaoLichHoc = {
  body: z.infer<typeof luocDoTaoLichHoc>["body"];
};

type DuLieuCapNhatLichHoc = {
  body: z.infer<typeof luocDoCapNhatLichHoc>["body"];
  params: {
    maLichHoc: string;
  };
};

type DuLieuCoMaLichHoc = {
  params: {
    maLichHoc: string;
  };
};

type DuLieuPreviewImport = {
  body: z.infer<typeof luocDoPreviewImportThoiKhoaBieu>["body"];
};

type DuLieuXacNhanImport = {
  body: z.infer<typeof luocDoXacNhanImportThoiKhoaBieu>["body"];
};

export class BoDieuKhienLichHoc {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  lietKe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { query } = req.duLieuDaXacThuc as DuLieuDanhSachLichHoc;
    const ketQua = await this.boPhuThuoc.xuLyDanhSachLichHoc.thucThi({
      actorId,
      maMonHoc: query.maMonHoc
    });

    res.status(200).json(thanhCong(ketQua));
  });

  tao = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuTaoLichHoc;
    const ketQua = await this.boPhuThuoc.xuLyTaoLichHoc.thucThi({ actorId, ...body });

    res.status(201).json(daTao(ketQua));
  });

  capNhat = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuCapNhatLichHoc;
    const ketQua = await this.boPhuThuoc.xuLyCapNhatLichHoc.thucThi({
      actorId,
      maLichHoc: params.maLichHoc,
      ...body
    });

    res.status(200).json(thanhCong(ketQua));
  });

  xoa = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { maLichHoc } = (req.duLieuDaXacThuc as DuLieuCoMaLichHoc).params;
    const ketQua = await this.boPhuThuoc.xuLyXoaLichHoc.thucThi({ actorId, maLichHoc });

    res.status(200).json(thanhCong(ketQua));
  });

  trichXuatHeaderImport = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const file = req.file;

    if (!file) {
      throw LoiUngDung.yeuCauSai(
        "Vui lòng tải lên file thời khóa biểu",
        taoChiTietImportThatBaiChoNhapThuCong("UPLOAD_FILE", { reasonCode: "FILE_MISSING" })
      );
    }

    const ketQua = await this.boPhuThuoc.xuLyTrichXuatHeaderImportThoiKhoaBieu.thucThi({
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
    const ketQua = await this.boPhuThuoc.xuLyPreviewImportThoiKhoaBieu.thucThi({
      actorId,
      maHocKy: body.maHocKy,
      rows: body.rows,
      mapping: body.mapping
    });

    res.status(200).json(thanhCong(ketQua));
  });

  xacNhanImport = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuXacNhanImport;
    const ketQua = await this.boPhuThuoc.xuLyXacNhanImportThoiKhoaBieu.thucThi({
      actorId,
      maHocKy: body.maHocKy,
      items: body.items
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
