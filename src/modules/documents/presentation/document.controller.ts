import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { cauHinh } from "../../../shared/config/env.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { daTao, thanhCong } from "../../../shared/http/api-response.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import type { CheDoHienThiTaiLieu } from "../domain/document.js";

const CAC_LOAI_FILE_HOP_LE = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/x-m4v",
  "video/webm",
  "video/x-msvideo"
]);

const luocDoDownloadUrl = z
  .string()
  .trim()
  .url()
  .max(4096)
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  }, "Download URL phai dung giao thuc HTTP hoac HTTPS");

export const luocDoUploadChiaSeTaiLieu = z.object({
  body: z.object({
    tieuDe: z.string().trim().min(1).max(255),
    maMonHoc: z.string().uuid(),
    cheDoHienThi: z.enum(["CONG_KHAI", "RIENG_TU", "CHIA_SE_NHOM"]),
    downloadUrl: luocDoDownloadUrl.optional(),
    loaiFile: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .refine((value) => CAC_LOAI_FILE_HOP_LE.has(value.toLowerCase()), "Dinh dang file khong duoc ho tro")
      .optional(),
    dungLuong: z.coerce.number().int().positive().optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoDanhSachTaiLieuSinhVien = z.object({
  body: z.object({}).optional(),
  params: z.object({}),
  query: z.object({
    q: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50)
  })
});

export const luocDoXoaTaiLieuSinhVien = z.object({
  body: z.object({}).optional(),
  params: z.object({
    maTaiLieu: z.string().uuid()
  }),
  query: z.object({})
});

type DuLieuUploadChiaSeTaiLieu = {
  body: {
    tieuDe: string;
    maMonHoc: string;
    cheDoHienThi: CheDoHienThiTaiLieu;
    downloadUrl?: string;
    loaiFile?: string;
    dungLuong?: number;
  };
};

type DuLieuDanhSachTaiLieuSinhVien = {
  query: {
    q?: string;
    page: number;
    limit: number;
  };
};

type DuLieuXoaTaiLieuSinhVien = {
  params: {
    maTaiLieu: string;
  };
};

const chonMimeType = (fileMimeType: string | undefined, bodyMimeType: string | undefined) => {
  const bodyMime = bodyMimeType?.trim().toLowerCase();
  const fileMime = fileMimeType?.trim().toLowerCase();

  if (fileMime && fileMime !== "application/octet-stream") {
    return fileMime;
  }

  return bodyMime || fileMime || "";
};

const dinhDangMb = (bytes: number) => Math.floor(bytes / (1024 * 1024));

const xacThucTepTaiLen = (file: Express.Multer.File | undefined, body: DuLieuUploadChiaSeTaiLieu["body"]) => {
  const mimeType = chonMimeType(file?.mimetype, body.loaiFile);
  const dungLuong = file?.size ?? body.dungLuong ?? 0;

  if (!file && !body.downloadUrl) {
    throw LoiUngDung.yeuCauSai("Vui long chon file hoac cung cap lien ket tai lieu");
  }

  if (!mimeType || !CAC_LOAI_FILE_HOP_LE.has(mimeType)) {
    throw LoiUngDung.yeuCauSai("Dinh dang file khong duoc ho tro");
  }

  const gioiHan = mimeType.startsWith("video/")
    ? cauHinh.cloudinary.maxVideoBytes
    : cauHinh.cloudinary.maxDocumentBytes;

  if (dungLuong <= 0 || dungLuong > gioiHan) {
    throw LoiUngDung.yeuCauSai(`File vuot qua dung luong toi da ${dinhDangMb(gioiHan)}MB`);
  }

  return { mimeType, dungLuong };
};

export class BoDieuKhienTaiLieu {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  lietKe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = req.user?.id;

    if (!actorId) {
      throw LoiUngDung.khongDuocXacThuc("Nguoi dung chua dang nhap");
    }

    const { query } = req.duLieuDaXacThuc as DuLieuDanhSachTaiLieuSinhVien;
    const ketQua = await this.boPhuThuoc.xuLyDanhSachTaiLieuSinhVien.thucThi({
      actorId,
      query: query.q,
      page: query.page,
      limit: query.limit
    });

    res.json(thanhCong(ketQua));
  });

  uploadChiaSe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = req.user?.id;

    if (!actorId) {
      throw LoiUngDung.khongDuocXacThuc("Nguoi dung chua dang nhap");
    }

    const { body } = req.duLieuDaXacThuc as DuLieuUploadChiaSeTaiLieu;
    const file = req.file;
    const { mimeType, dungLuong } = xacThucTepTaiLen(file, body);
    const taiLieu = await this.boPhuThuoc.xuLyUploadChiaSeTaiLieu.thucThi({
      actorId,
      tieuDe: body.tieuDe,
      maMonHoc: body.maMonHoc,
      cheDoHienThi: body.cheDoHienThi,
      downloadUrl: body.downloadUrl,
      loaiFile: mimeType,
      dungLuong,
      tep: file
        ? {
            buffer: file.buffer,
            originalName: file.originalname,
            mimeType,
            size: file.size
          }
        : undefined
    });

    res.status(201).json(
      daTao({
        message: "Chia sẻ dữ liệu thành công",
        taiLieu
      })
    );
  });

  xoa = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = req.user?.id;

    if (!actorId) {
      throw LoiUngDung.khongDuocXacThuc("Nguoi dung chua dang nhap");
    }

    const { params } = req.duLieuDaXacThuc as DuLieuXoaTaiLieuSinhVien;
    const ketQua = await this.boPhuThuoc.xuLyXoaTaiLieuSinhVien.thucThi({
      actorId,
      maTaiLieu: params.maTaiLieu
    });

    res.json(thanhCong(ketQua));
  });
}
