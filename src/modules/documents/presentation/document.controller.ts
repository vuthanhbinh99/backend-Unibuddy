import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { daTao } from "../../../shared/http/api-response.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import type { CheDoHienThiTaiLieu } from "../domain/document.js";

const DUNG_LUONG_TOI_DA = 50 * 1024 * 1024;

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
  "image/jpeg"
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
    downloadUrl: luocDoDownloadUrl,
    loaiFile: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .refine((value) => CAC_LOAI_FILE_HOP_LE.has(value.toLowerCase()), "Dinh dang file khong duoc ho tro"),
    dungLuong: z.coerce.number().int().positive().max(DUNG_LUONG_TOI_DA)
  }),
  params: z.object({}),
  query: z.object({})
});

type DuLieuUploadChiaSeTaiLieu = {
  body: {
    tieuDe: string;
    maMonHoc: string;
    cheDoHienThi: CheDoHienThiTaiLieu;
    downloadUrl: string;
    loaiFile: string;
    dungLuong: number;
  };
};

export class BoDieuKhienTaiLieu {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  uploadChiaSe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = req.user?.id;

    if (!actorId) {
      throw LoiUngDung.khongDuocXacThuc("Nguoi dung chua dang nhap");
    }

    const { body } = req.duLieuDaXacThuc as DuLieuUploadChiaSeTaiLieu;
    const taiLieu = await this.boPhuThuoc.xuLyUploadChiaSeTaiLieu.thucThi({
      actorId,
      tieuDe: body.tieuDe,
      maMonHoc: body.maMonHoc,
      cheDoHienThi: body.cheDoHienThi,
      downloadUrl: body.downloadUrl,
      loaiFile: body.loaiFile.toLowerCase(),
      dungLuong: body.dungLuong
    });

    res.status(201).json(
      daTao({
        message: "Chia sẻ dữ liệu thành công",
        taiLieu
      })
    );
  });
}
