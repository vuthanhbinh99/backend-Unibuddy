import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { daTao, thanhCong } from "../../../shared/http/api-response.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";

const maNhom = z.string().trim();
const maCongViec = z.string().trim();
const maBinhLuan = z.string().trim();

export const luocDoXemBangKanban = z.object({
  body: z.object({}),
  params: z.object({ maNhom }),
  query: z.object({})
});

export const luocDoTaoCongViecKanban = z.object({
  body: z.object({
    maNhom: z.string().trim().optional().nullable(),
    tieuDe: z.string().trim().optional().nullable(),
    moTa: z.string().trim().optional().nullable(),
    hanHoanThanh: z.union([z.string().trim(), z.date()]).optional().nullable(),
    nguoiDuocGiao: z.string().trim().optional().nullable()
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoCapNhatThongTinCongViecKanban = z.object({
  body: z.object({
    tieuDe: z.string().trim().optional().nullable(),
    moTa: z.string().trim().optional().nullable(),
    hanHoanThanh: z.union([z.string().trim(), z.date()]).optional().nullable()
  }),
  params: z.object({ maCongViec }),
  query: z.object({})
});

export const luocDoCapNhatTrangThaiCongViecKanban = z.object({
  body: z.object({
    trangThaiMoi: z.string().trim().optional().nullable(),
    viTriMoi: z.number().optional().nullable(),
    nguonThaoTac: z.enum(["DRAG_DROP", "FALLBACK_UI"]).optional().nullable()
  }),
  params: z.object({ maCongViec }),
  query: z.object({})
});

export const luocDoPhanCongCongViecKanban = z.object({
  body: z.object({
    nguoiDuocGiao: z.string().trim().optional().nullable()
  }),
  params: z.object({ maCongViec }),
  query: z.object({})
});

export const luocDoXoaCongViecKanban = z.object({
  body: z.object({}),
  params: z.object({ maCongViec }),
  query: z.object({})
});

export const luocDoBinhLuanCongViecKanban = z.object({
  body: z.object({
    noiDung: z.string().trim().optional().nullable()
  }),
  params: z.object({ maCongViec }),
  query: z.object({})
});

export const luocDoThuHoiBinhLuanCongViecKanban = z.object({
  body: z.object({}),
  params: z.object({ maCongViec, maBinhLuan }),
  query: z.object({})
});

export const luocDoLayLienKetNhomChatKanban = z.object({
  body: z.object({}),
  params: z.object({ maNhom }),
  query: z.object({})
});

type DuLieuCoMaNhom = {
  params: {
    maNhom: string;
  };
};

type DuLieuCoMaCongViec = {
  params: {
    maCongViec: string;
  };
};

type DuLieuTaoCongViec = {
  body: z.infer<typeof luocDoTaoCongViecKanban>["body"];
};

type DuLieuCapNhatThongTin = DuLieuCoMaCongViec & {
  body: z.infer<typeof luocDoCapNhatThongTinCongViecKanban>["body"];
};

type DuLieuCapNhatTrangThai = DuLieuCoMaCongViec & {
  body: z.infer<typeof luocDoCapNhatTrangThaiCongViecKanban>["body"];
};

type DuLieuPhanCong = DuLieuCoMaCongViec & {
  body: z.infer<typeof luocDoPhanCongCongViecKanban>["body"];
};

type DuLieuBinhLuan = DuLieuCoMaCongViec & {
  body: z.infer<typeof luocDoBinhLuanCongViecKanban>["body"];
};

type DuLieuThuHoiBinhLuan = DuLieuCoMaCongViec & {
  params: {
    maCongViec: string;
    maBinhLuan: string;
  };
};

export class BoDieuKhienKanban {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  xemBang = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { maNhom: maNhomParam } = (req.duLieuDaXacThuc as DuLieuCoMaNhom).params;
    const ketQua = await this.boPhuThuoc.xuLyXemBangKanban.thucThi({
      actorId,
      maNhom: maNhomParam
    });

    res.status(200).json(thanhCong(ketQua));
  });

  tao = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuTaoCongViec;
    const ketQua = await this.boPhuThuoc.xuLyTaoCongViecKanban.thucThi({
      actorId,
      maNhom: body.maNhom ?? "",
      tieuDe: body.tieuDe,
      moTa: body.moTa,
      hanHoanThanh: body.hanHoanThanh,
      nguoiDuocGiao: body.nguoiDuocGiao
    });

    res.status(201).json(daTao(ketQua));
  });

  capNhatThongTin = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuCapNhatThongTin;
    const ketQua = await this.boPhuThuoc.xuLyCapNhatThongTinCongViecKanban.thucThi({
      actorId,
      maCongViec: params.maCongViec,
      tieuDe: body.tieuDe,
      moTa: body.moTa,
      hanHoanThanh: body.hanHoanThanh
    });

    res.status(200).json(thanhCong(ketQua));
  });

  capNhatTrangThai = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuCapNhatTrangThai;
    const ketQua = await this.boPhuThuoc.xuLyCapNhatTrangThaiCongViecKanban.thucThi({
      actorId,
      maCongViec: params.maCongViec,
      trangThaiMoi: body.trangThaiMoi,
      viTriMoi: body.viTriMoi,
      nguonThaoTac: body.nguonThaoTac
    });

    res.status(200).json(thanhCong(ketQua));
  });

  phanCong = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuPhanCong;
    const ketQua = await this.boPhuThuoc.xuLyPhanCongCongViecKanban.thucThi({
      actorId,
      maCongViec: params.maCongViec,
      nguoiDuocGiao: body.nguoiDuocGiao
    });

    res.status(200).json(thanhCong(ketQua));
  });

  xoa = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { maCongViec: maCongViecParam } = (req.duLieuDaXacThuc as DuLieuCoMaCongViec).params;
    const ketQua = await this.boPhuThuoc.xuLyXoaCongViecKanban.thucThi({
      actorId,
      maCongViec: maCongViecParam
    });

    res.status(200).json(thanhCong(ketQua));
  });

  binhLuan = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuBinhLuan;
    const ketQua = await this.boPhuThuoc.xuLyBinhLuanCongViecKanban.thucThi({
      actorId,
      maCongViec: params.maCongViec,
      noiDung: body.noiDung
    });

    res.status(201).json(daTao(ketQua));
  });

  thuHoiBinhLuan = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { params } = req.duLieuDaXacThuc as DuLieuThuHoiBinhLuan;
    const ketQua = await this.boPhuThuoc.xuLyThuHoiBinhLuanCongViecKanban.thucThi({
      actorId,
      maCongViec: params.maCongViec,
      maBinhLuan: params.maBinhLuan
    });

    res.status(200).json(thanhCong(ketQua));
  });

  layLienKetNhomChat = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { maNhom: maNhomParam } = (req.duLieuDaXacThuc as DuLieuCoMaNhom).params;
    const ketQua = await this.boPhuThuoc.xuLyLayLienKetNhomChatKanban.thucThi({
      actorId,
      maNhom: maNhomParam
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
