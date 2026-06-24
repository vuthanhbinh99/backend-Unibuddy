import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { daTao, thanhCong } from "../../../shared/http/api-response.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";

const maMonHoc = z.string().uuid();
const maHocKy = z.string().uuid();

const ngayIso = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có định dạng YYYY-MM-DD")
  .optional()
  .nullable()
  .transform((value) => value ?? null);

const maMon = z
  .string()
  .trim()
  .max(50)
  .optional()
  .nullable()
  .transform((value) => value || null);

const tenMon = z
  .string()
  .trim()
  .min(1, "Tên môn học không được phép để trống")
  .max(255);

const soTinChi = z.coerce
  .number()
  .int()
  .positive("Số tín chỉ phải lớn hơn 0")
  .max(30);

const hocPhanBody = z.object({
  maHocKy,
  maMon,
  tenMon,
  soTinChi
});

const hocPhanTrongHocKyBody = hocPhanBody.omit({
  maHocKy: true
});

const hocKyBody = z
  .object({
    tenHocKy: z
      .string()
      .trim()
      .min(1, "Tên học kỳ không được phép để trống")
      .max(100),
    ngayBatDau: ngayIso,
    ngayKetThuc: ngayIso
  })
  .superRefine((data, ctx) => {
    if (data.ngayBatDau && data.ngayKetThuc && data.ngayBatDau >= data.ngayKetThuc) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ngayKetThuc"],
        message: "Ngày kết thúc phải lớn hơn ngày bắt đầu"
      });
    }
  });

export const luocDoDanhSachHocPhan = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    maHocKy: maHocKy.optional().nullable().transform((value) => value ?? null)
  })
});

export const luocDoChiTietHocPhan = z.object({
  body: z.object({}),
  params: z.object({ maMonHoc }),
  query: z.object({})
});

export const luocDoTaoHocKy = z.object({
  body: hocKyBody,
  params: z.object({}),
  query: z.object({})
});

export const luocDoTaoHocPhan = z.object({
  body: hocPhanBody,
  params: z.object({}),
  query: z.object({})
});

export const luocDoTaoHocPhanTrongHocKy = z.object({
  body: hocPhanTrongHocKyBody,
  params: z.object({ maHocKy }),
  query: z.object({})
});

export const luocDoCapNhatHocPhan = z.object({
  body: hocPhanBody,
  params: z.object({ maMonHoc }),
  query: z.object({})
});

export const luocDoXoaHocPhan = z.object({
  body: z.object({
    force: z.coerce.boolean().optional().default(false)
  }),
  params: z.object({ maMonHoc }),
  query: z.object({})
});

type DuLieuDanhSachHocPhan = {
  query: {
    maHocKy: string | null;
  };
};

type DuLieuCoMaMonHoc = {
  params: {
    maMonHoc: string;
  };
};

type DuLieuTaoHocPhan = {
  body: z.infer<typeof luocDoTaoHocPhan>["body"];
};

type DuLieuTaoHocKy = {
  body: z.infer<typeof luocDoTaoHocKy>["body"];
};

type DuLieuTaoHocPhanTrongHocKy = {
  body: z.infer<typeof luocDoTaoHocPhanTrongHocKy>["body"];
  params: {
    maHocKy: string;
  };
};

type DuLieuCapNhatHocPhan = {
  body: z.infer<typeof luocDoCapNhatHocPhan>["body"];
  params: {
    maMonHoc: string;
  };
};

type DuLieuXoaHocPhan = DuLieuCoMaMonHoc & {
  body: z.infer<typeof luocDoXoaHocPhan>["body"];
};

export class BoDieuKhienHocPhan {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  lietKe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { query } = req.duLieuDaXacThuc as DuLieuDanhSachHocPhan;
    const ketQua = await this.boPhuThuoc.xuLyDanhSachHocPhan.thucThi({
      actorId,
      maHocKy: query.maHocKy
    });

    res.status(200).json(thanhCong(ketQua));
  });

  chiTiet = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { maMonHoc } = (req.duLieuDaXacThuc as DuLieuCoMaMonHoc).params;
    const ketQua = await this.boPhuThuoc.xuLyChiTietHocPhan.thucThi({ actorId, maMonHoc });

    res.status(200).json(thanhCong(ketQua));
  });

  taoHocKy = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuTaoHocKy;
    const ketQua = await this.boPhuThuoc.xuLyTaoHocKy.thucThi({
      actorId,
      tenHocKy: body.tenHocKy,
      ngayBatDau: body.ngayBatDau,
      ngayKetThuc: body.ngayKetThuc
    });

    res.status(201).json(daTao(ketQua));
  });

  tao = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuTaoHocPhan;
    const ketQua = await this.boPhuThuoc.xuLyTaoHocPhan.thucThi({ actorId, ...body });

    res.status(201).json(daTao(ketQua));
  });

  taoTrongHocKy = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuTaoHocPhanTrongHocKy;
    const ketQua = await this.boPhuThuoc.xuLyTaoHocPhan.thucThi({
      actorId,
      maHocKy: params.maHocKy,
      ...body
    });

    res.status(201).json(daTao(ketQua));
  });

  capNhat = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuCapNhatHocPhan;
    const ketQua = await this.boPhuThuoc.xuLyCapNhatHocPhan.thucThi({
      actorId,
      maMonHoc: params.maMonHoc,
      ...body
    });

    res.status(200).json(thanhCong(ketQua));
  });

  xoa = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuXoaHocPhan;
    const ketQua = await this.boPhuThuoc.xuLyXoaHocPhan.thucThi({
      actorId,
      maMonHoc: params.maMonHoc,
      force: body.force
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
