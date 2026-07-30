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
  }, "Download URL phải dùng giao thức HTTP hoặc HTTPS");

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
      .refine((value) => CAC_LOAI_FILE_HOP_LE.has(value.toLowerCase()), "Định dạng file không được hỗ trợ")
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

export const luocDoBaoCaoTaiLieu = z.object({
  body: z.object({
    lyDo: z.string().trim().min(10).max(1000)
  }),
  params: z.object({
    maTaiLieu: z.string().uuid()
  }),
  query: z.object({})
});

export const luocDoTomTatTaiLieuBangAi = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(255),
    content: z.string().trim().min(30).max(12000),
    objective: z.string().trim().max(500).optional().nullable()
  }),
  params: z.object({}),
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

type DuLieuBaoCaoTaiLieu = {
  body: {
    lyDo: string;
  };
  params: {
    maTaiLieu: string;
  };
};

type DuLieuTomTatTaiLieuBangAi = {
  body: z.infer<typeof luocDoTomTatTaiLieuBangAi>["body"];
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
    throw LoiUngDung.yeuCauSai("Vui lòng chọn file hoặc cung cấp liên kết tài liệu");
  }

  if (!mimeType || !CAC_LOAI_FILE_HOP_LE.has(mimeType)) {
    throw LoiUngDung.yeuCauSai("Định dạng file không được hỗ trợ");
  }

  const gioiHan = mimeType.startsWith("video/")
    ? cauHinh.cloudinary.maxVideoBytes
    : cauHinh.cloudinary.maxDocumentBytes;

  if (dungLuong <= 0 || dungLuong > gioiHan) {
    throw LoiUngDung.yeuCauSai(`File vượt quá dung lượng tối đa ${dinhDangMb(gioiHan)}MB`);
  }

  return { mimeType, dungLuong };
};

export class BoDieuKhienTaiLieu {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  lietKe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = req.user?.id;

    if (!actorId) {
      throw LoiUngDung.khongDuocXacThuc("Người dùng chưa đăng nhập");
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
      throw LoiUngDung.khongDuocXacThuc("Người dùng chưa đăng nhập");
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
      throw LoiUngDung.khongDuocXacThuc("Người dùng chưa đăng nhập");
    }

    const { params } = req.duLieuDaXacThuc as DuLieuXoaTaiLieuSinhVien;
    const ketQua = await this.boPhuThuoc.xuLyXoaTaiLieuSinhVien.thucThi({
      actorId,
      maTaiLieu: params.maTaiLieu
    });

    res.json(thanhCong(ketQua));
  });

  baoCao = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = req.user?.id;

    if (!actorId) {
      throw LoiUngDung.khongDuocXacThuc("Người dùng chưa đăng nhập");
    }

    const { body, params } = req.duLieuDaXacThuc as DuLieuBaoCaoTaiLieu;
    const baoCao = await this.boPhuThuoc.xuLyTaoBaoCaoTaiLieu.thucThi({
      maTaiLieu: params.maTaiLieu,
      nguoiBaoCao: actorId,
      lyDo: body.lyDo
    });

    res.status(201).json(
      daTao({
        message: "Đã gửi báo cáo tài liệu cho quản trị viên",
        baoCao
      })
    );
  });

  tomTatBangAi = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = req.user?.id;

    if (!actorId) {
      throw LoiUngDung.khongDuocXacThuc("Người dùng chưa đăng nhập");
    }

    const { body } = req.duLieuDaXacThuc as DuLieuTomTatTaiLieuBangAi;
    const ketQua = await this.boPhuThuoc.xuLyTomTatTaiLieuBangAi.thucThi({
      actorId,
      title: body.title,
      content: body.content,
      objective: body.objective
    });

    res.json(thanhCong(ketQua));
  });
}
