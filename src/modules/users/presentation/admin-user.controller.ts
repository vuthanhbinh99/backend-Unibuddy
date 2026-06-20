import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import { daTao, thanhCong } from "../../../shared/http/api-response.js";

const maNguoiDung = z.string().trim().min(1);

export const luocDoDanhSachNguoiDungQuanTri = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({})
});

export const luocDoChiTietNguoiDungQuanTri = z.object({
  body: z.object({}),
  params: z.object({ userId: maNguoiDung }),
  query: z.object({})
});

export const luocDoTaoTaiKhoanQuanTri = z.object({
  body: z.object({
    email: z.string().email(),
    fullName: z.string().trim().min(1),
    phoneNumber: z.string().trim().min(1).optional(),
    avatarUrl: z.string().trim().min(1).optional(),
    roleCode: z.enum(["ADMIN", "QUAN_TRI_VIEN"]).default("ADMIN")
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoCapNhatVaiTroNguoiDung = z.object({
  body: z.object({
    roleCode: z.enum(["SINH_VIEN", "ADMIN", "QUAN_TRI_VIEN"])
  }),
  params: z.object({ userId: maNguoiDung }),
  query: z.object({})
});

export const luocDoCapNhatTrangThaiNguoiDung = z.object({
  body: z.object({
    status: z.enum(["HOAT_DONG", "BI_KHOA", "CHO_DOI_MAT_KHAU"])
  }),
  params: z.object({ userId: maNguoiDung }),
  query: z.object({})
});

type DuLieuCoUserId = {
  params: {
    userId: string;
  };
};

type DuLieuTaoTaiKhoanQuanTri = {
  body: z.infer<typeof luocDoTaoTaiKhoanQuanTri>["body"];
};

type DuLieuCapNhatVaiTro = {
  body: z.infer<typeof luocDoCapNhatVaiTroNguoiDung>["body"];
};

type DuLieuCapNhatTrangThai = {
  body: z.infer<typeof luocDoCapNhatTrangThaiNguoiDung>["body"];
};

export class BoDieuKhienNguoiDungQuanTri {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  lietKe = xuLyBatDongBo(async (_req: Request, res: Response) => {
    const danhSach = await this.boPhuThuoc.xuLyDanhSachNguoiDung.thucThi();
    res.status(200).json(thanhCong(danhSach));
  });

  chiTiet = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { userId } = (req.duLieuDaXacThuc as DuLieuCoUserId).params;
    const user = await this.boPhuThuoc.xuLyLayChiTietNguoiDung.thucThi(userId);
    res.status(200).json(thanhCong(user));
  });

  tao = xuLyBatDongBo(async (req: Request, res: Response) => {
    const body = (req.duLieuDaXacThuc as DuLieuTaoTaiKhoanQuanTri).body;
    const ketQua = await this.boPhuThuoc.xuLyTaoTaiKhoanQuanTri.thucThi({
      actorId: req.user?.id ?? null,
      email: body.email,
      fullName: body.fullName,
      phoneNumber: body.phoneNumber ?? null,
      avatarUrl: body.avatarUrl ?? null,
      roleCode: body.roleCode
    });

    res.status(201).json(daTao(ketQua));
  });

  capNhatVaiTro = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { userId } = (req.duLieuDaXacThuc as DuLieuCoUserId).params;
    const body = (req.duLieuDaXacThuc as DuLieuCapNhatVaiTro).body;
    const ketQua = await this.boPhuThuoc.xuLyCapNhatVaiTroNguoiDung.thucThi({
      actorId: req.user?.id ?? null,
      userId,
      roleCode: body.roleCode
    });

    res.status(200).json(thanhCong(ketQua));
  });

  capNhatTrangThai = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { userId } = (req.duLieuDaXacThuc as DuLieuCoUserId).params;
    const body = (req.duLieuDaXacThuc as DuLieuCapNhatTrangThai).body;
    const ketQua = await this.boPhuThuoc.xuLyCapNhatTrangThaiNguoiDung.thucThi({
      actorId: req.user?.id ?? null,
      userId,
      status: body.status
    });

    res.status(200).json(thanhCong(ketQua));
  });
}