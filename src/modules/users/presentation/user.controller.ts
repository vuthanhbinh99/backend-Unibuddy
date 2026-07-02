import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { cauHinh } from "../../../shared/config/env.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import { daTao, thanhCong } from "../../../shared/http/api-response.js";

export const luocDoCapNhatThongTinNguoiDungHienTai = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(1).optional(),
      phoneNumber: z.string().trim().min(1).nullable().optional()
    })
    .refine(
      (value) => value.fullName !== undefined || value.phoneNumber !== undefined,
      {
        message: "Phải cung cấp ít nhất một trường để cập nhật"
      }
    ),
  params: z.object({}),
  query: z.object({})
});

export const luocDoGuiPhanHoiNguoiDungHienTai = z.object({
  body: z.object({
    category: z.enum(["bug", "feature", "ui", "other"]),
    message: z.string().trim().min(10)
  }),
  params: z.object({}),
  query: z.object({})
});

const CAC_LOAI_ANH_AVATAR_HOP_LE = new Set(["image/png", "image/jpeg", "image/webp"]);
const CAC_LOAI_ANH_PHAN_HOI_HOP_LE = new Set(["image/png", "image/jpeg", "image/webp"]);

const layChuoi = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const chonMimeType = (fileMimeType: string | undefined, bodyMimeType: string | undefined) => {
  const bodyMime = bodyMimeType?.trim().toLowerCase();
  const fileMime = fileMimeType?.trim().toLowerCase();

  if (fileMime && fileMime !== "application/octet-stream") {
    return fileMime;
  }

  return bodyMime || fileMime || "";
};

const dinhDangMb = (bytes: number) => Math.floor(bytes / (1024 * 1024));

export class BoDieuKhienNguoiDung {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  thongTinCuaToi = xuLyBatDongBo(async (req: Request, res: Response) => {
    if (!req.user) {
      throw LoiUngDung.khongDuocXacThuc();
    }

    const user = await this.boPhuThuoc.xuLyLayNguoiDungHienTai.thucThi(req.user.id);
    res.status(200).json(thanhCong(user));
  });

  capNhatThongTinCuaToi = xuLyBatDongBo(async (req: Request, res: Response) => {
    if (!req.user) {
      throw LoiUngDung.khongDuocXacThuc();
    }

    const body = req.body as {
      fullName?: string;
      phoneNumber?: string | null;
    };

    const ketQua = await this.boPhuThuoc.xuLyCapNhatThongTinNguoiDungHienTai.thucThi({
      actorId: req.user.id,
      fullName: body.fullName,
      phoneNumber: body.phoneNumber ?? undefined
    });

    res.status(200).json(thanhCong(ketQua));
  });

  guiPhanHoiCuaToi = xuLyBatDongBo(async (req: Request, res: Response) => {
    if (!req.user) {
      throw LoiUngDung.khongDuocXacThuc();
    }

    const body = (req.duLieuDaXacThuc as {
      body: {
        category: "bug" | "feature" | "ui" | "other";
        message: string;
      };
    }).body;

    const file = req.file;

    if (file && !CAC_LOAI_ANH_PHAN_HOI_HOP_LE.has(file.mimetype)) {
      throw LoiUngDung.yeuCauSai("Phản hồi chỉ hô trợ ảnh PNG, JPG hoặc WebP");
    }

    if (file && (file.size <= 0 || file.size > cauHinh.cloudinary.maxAvatarBytes)) {
      throw LoiUngDung.yeuCauSai(`AAnh phản hồi có dung lượng tối đa ${dinhDangMb(cauHinh.cloudinary.maxAvatarBytes)}MB`);
    }

    const ketQua = await this.boPhuThuoc.xuLyGuiPhanHoiNguoiDungHienTai.thucThi({
      actorId: req.user.id,
      category: body.category,
      message: body.message,
      tep: file
        ? {
            buffer: file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size
          }
        : undefined
    });

    res.status(201).json(daTao(ketQua));
  });

  capNhatAnhDaiDien = xuLyBatDongBo(async (req: Request, res: Response) => {
    if (!req.user) {
      throw LoiUngDung.khongDuocXacThuc();
    }

    const file = req.file;
    const body = req.body as Record<string, unknown>;
    const mimeType = chonMimeType(file?.mimetype, layChuoi(body.mimeType));

    if (!file) {
      throw LoiUngDung.yeuCauSai("Vui lòng chọn ảnh đại diện");
    }

    if (!CAC_LOAI_ANH_AVATAR_HOP_LE.has(mimeType)) {
      throw LoiUngDung.yeuCauSai("Ảnh đại diện chỉ hỗ trợ PNG, JPG hoặc WebP");
    }

    if (file.size <= 0 || file.size > cauHinh.cloudinary.maxAvatarBytes) {
      throw LoiUngDung.yeuCauSai(`Ảnh đại diện vượt quá dung lượng tối đa ${dinhDangMb(cauHinh.cloudinary.maxAvatarBytes)}MB`);
    }

    const ketQua = await this.boPhuThuoc.xuLyCapNhatAnhDaiDienCuaToi.thucThi({
      actorId: req.user.id,
      tep: {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType,
        size: file.size
      }
    });

    res.status(200).json(thanhCong(ketQua));
  });
}



