import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { daTao, thanhCong } from "../../../shared/http/api-response.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import { taoChiTietImportDiemThatBaiChoNhapThuCong } from "../application/services/grade-import-manual-fallback.service.js";

const maHocKy = z.string().uuid();
const maMonHoc = z.string().uuid();
const diemSo = z.coerce.number().min(0).max(10);
const trongSo = z.coerce.number().positive().max(100);

const dongImport = z.record(z.unknown());

const mappingImport = z.object({
  maMonHoc: z.string().trim().min(1).optional(),
  maMon: z.string().trim().min(1).optional(),
  tenMon: z.string().trim().min(1).optional(),
  soTinChi: z.string().trim().min(1).optional(),
  tenThanhPhan: z.string().trim().min(1).optional(),
  trongSo: z.string().trim().min(1).optional(),
  diem: z.string().trim().min(1).optional(),
  diemTongKet: z.string().trim().min(1).optional()
});

const itemImportDiemSo = z.object({
  rowIndex: z.coerce.number().int().positive(),
  maMonHoc: maMonHoc.optional().nullable().default(null),
  maMon: z.string().trim().nullable().default(null),
  tenMon: z.string().trim().min(1),
  soTinChi: z.coerce.number().int().positive().optional().nullable().default(null),
  tenThanhPhan: z.string().trim().min(1),
  trongSo,
  diem: diemSo,
  tuDongTaoMonHoc: z.coerce.boolean().optional().default(false)
});

export const luocDoXemBangDiem = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    maHocKy: maHocKy.optional()
  })
});

export const luocDoTaoThanhPhanDiem = z.object({
  body: z.object({
    maMonHoc: maMonHoc.optional().nullable(),
    tenThanhPhan: z.string().trim().optional().nullable(),
    trongSo: trongSo.optional().nullable(),
    diem: diemSo.optional().nullable()
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoCapNhatThanhPhanDiem = z.object({
  body: z.object({
    diem: diemSo.optional().nullable()
  }),
  params: z.object({
    maThanhPhan: z.string().trim().min(1)
  }),
  query: z.object({})
});

export const luocDoCauHinhTrongSo = z.object({
  body: z.object({
    maMonHoc: maMonHoc.optional().nullable(),
    components: z
      .array(
        z.object({
          tenThanhPhan: z.string().trim().optional().nullable(),
          trongSo: trongSo.optional().nullable(),
          diem: diemSo.optional().nullable()
        })
      )
      .optional()
      .nullable()
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoDuPhongGpa = z.object({
  body: z.object({
    maHocKy,
    targetGpa: z.coerce.number().optional().nullable(),
    target_gpa: z.coerce.number().optional().nullable(),
    gpaMucTieu: z.coerce.number().optional().nullable(),
    GPA_MUC_TIEU: z.coerce.number().optional().nullable()
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoPreviewImportDiemSo = z.object({
  body: z.object({
    maHocKy: maHocKy.optional().nullable().transform((value) => value ?? null),
    rows: z.array(dongImport).max(2000).default([]),
    mapping: mappingImport.default({})
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoXacNhanImportDiemSo = z.object({
  body: z.object({
    maHocKy: maHocKy.optional().nullable().transform((value) => value ?? null),
    items: z.array(itemImportDiemSo).min(1).max(2000)
  }),
  params: z.object({}),
  query: z.object({})
});

type DuLieuXemBangDiem = {
  query: z.infer<typeof luocDoXemBangDiem>["query"];
};

type DuLieuTaoThanhPhanDiem = {
  body: z.infer<typeof luocDoTaoThanhPhanDiem>["body"];
};

type DuLieuCapNhatThanhPhanDiem = {
  body: z.infer<typeof luocDoCapNhatThanhPhanDiem>["body"];
  params: {
    maThanhPhan: string;
  };
};

type DuLieuCauHinhTrongSo = {
  body: z.infer<typeof luocDoCauHinhTrongSo>["body"];
};

type DuLieuDuPhongGpa = {
  body: z.infer<typeof luocDoDuPhongGpa>["body"];
};

type DuLieuPreviewImport = {
  body: z.infer<typeof luocDoPreviewImportDiemSo>["body"];
};

type DuLieuXacNhanImport = {
  body: z.infer<typeof luocDoXacNhanImportDiemSo>["body"];
};

export class BoDieuKhienDiemSo {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  xemBangDiem = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { query } = req.duLieuDaXacThuc as DuLieuXemBangDiem;
    const ketQua = await this.boPhuThuoc.xuLyXemBangDiem.thucThi({
      actorId,
      maHocKy: query.maHocKy
    });

    res.status(200).json(thanhCong(ketQua));
  });

  taoThanhPhanDiem = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuTaoThanhPhanDiem;
    const ketQua = await this.boPhuThuoc.xuLyTaoThanhPhanDiem.thucThi({
      actorId,
      ...body
    });

    res.status(201).json(daTao(ketQua));
  });

  capNhatThanhPhanDiem = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuCapNhatThanhPhanDiem;
    const ketQua = await this.boPhuThuoc.xuLyCapNhatThanhPhanDiem.thucThi({
      actorId,
      maThanhPhan: params.maThanhPhan,
      diem: body.diem
    });

    res.status(200).json(thanhCong(ketQua));
  });

  cauHinhTrongSo = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuCauHinhTrongSo;
    const ketQua = await this.boPhuThuoc.xuLyCauHinhTrongSoDiem.thucThi({
      actorId,
      maMonHoc: body.maMonHoc,
      components: body.components
    });

    res.status(200).json(thanhCong(ketQua));
  });

  duPhongGpa = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuDuPhongGpa;
    const ketQua = await this.boPhuThuoc.xuLyDuPhongGpa.thucThi({
      actorId,
      maHocKy: body.maHocKy,
      targetGpa: body.targetGpa ?? body.target_gpa ?? body.gpaMucTieu ?? body.GPA_MUC_TIEU
    });

    res.status(200).json(thanhCong(ketQua));
  });

  trichXuatHeaderImport = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const file = req.file;

    if (!file) {
      throw LoiUngDung.yeuCauSai(
        "Vui lòng tải lên file điểm số",
        taoChiTietImportDiemThatBaiChoNhapThuCong("UPLOAD_FILE", { reasonCode: "FILE_MISSING" })
      );
    }

    const ketQua = await this.boPhuThuoc.xuLyTrichXuatHeaderImportDiemSo.thucThi({
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
    const ketQua = await this.boPhuThuoc.xuLyPreviewImportDiemSo.thucThi({
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
    const ketQua = await this.boPhuThuoc.xuLyXacNhanImportDiemSo.thucThi({
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
