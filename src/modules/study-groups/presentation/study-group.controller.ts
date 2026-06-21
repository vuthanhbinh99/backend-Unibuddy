import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { daTao, thanhCong } from "../../../shared/http/api-response.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";

const maNhom = z.string().uuid();
const maMonHoc = z.string().uuid();

const tenNhomHocTap = z
  .string()
  .trim()
  .min(1, "Tên nhóm không được phép để trống!")
  .max(255);

const linkNhomChat = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .default("");

export const luocDoTaoNhomHocTap = z.object({
  body: z.object({
    tenNhom: tenNhomHocTap,
    maMonHoc,
    linkNhomChat
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoThamGiaNhomHocTap = z.object({
  body: z.object({
    maThamGia: z
      .string()
      .trim()
      .min(1, "Mã mời tham gia nhóm không được để trống!")
      .max(30)
      .transform((value) => value.toUpperCase())
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoRoiNhomHocTap = z.object({
  body: z.object({}),
  params: z.object({ maNhom }),
  query: z.object({})
});

export const luocDoXoaNhomHocTap = z.object({
  body: z.object({
    matKhauXacNhan: z.string().min(1, "Mật khẩu xác nhận không được để trống")
  }),
  params: z.object({ maNhom }),
  query: z.object({})
});

type DuLieuTaoNhomHocTap = {
  body: z.infer<typeof luocDoTaoNhomHocTap>["body"];
};

type DuLieuThamGiaNhomHocTap = {
  body: z.infer<typeof luocDoThamGiaNhomHocTap>["body"];
};

type DuLieuCoMaNhom = {
  params: {
    maNhom: string;
  };
};

type DuLieuXoaNhomHocTap = DuLieuCoMaNhom & {
  body: z.infer<typeof luocDoXoaNhomHocTap>["body"];
};

export class BoDieuKhienNhomHocTap {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  tao = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuTaoNhomHocTap;
    const ketQua = await this.boPhuThuoc.xuLyTaoNhomHocTap.thucThi({
      actorId,
      tenNhom: body.tenNhom,
      maMonHoc: body.maMonHoc,
      linkNhomChat: body.linkNhomChat
    });

    res.status(201).json(daTao(ketQua));
  });

  thamGia = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuThamGiaNhomHocTap;
    const ketQua = await this.boPhuThuoc.xuLyThamGiaNhomHocTap.thucThi({
      actorId,
      maThamGia: body.maThamGia
    });

    res.status(201).json(daTao(ketQua));
  });

  roi = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { maNhom } = (req.duLieuDaXacThuc as DuLieuCoMaNhom).params;
    const ketQua = await this.boPhuThuoc.xuLyRoiNhomHocTap.thucThi({ actorId, maNhom });

    res.status(200).json(thanhCong(ketQua));
  });

  xoa = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuXoaNhomHocTap;
    const ketQua = await this.boPhuThuoc.xuLyXoaNhomHocTap.thucThi({
      actorId,
      maNhom: params.maNhom,
      matKhauXacNhan: body.matKhauXacNhan
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
