import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { daTao, thanhCong } from "../../../shared/http/api-response.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import {
  CAC_KET_QUA_ON_TAP_FLASHCARD,
  CAC_LOAI_THE_FLASHCARD,
  CAC_MUC_DO_GHI_NHO_FLASHCARD
} from "../domain/flashcard.js";

const maTaiNguyen = z.string().trim().min(1);

export const luocDoDanhSachBoFlashcard = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    maMonHoc: z.string().trim().optional().nullable()
  })
});

export const luocDoTaoBoFlashcard = z.object({
  body: z.object({
    tenBo: z.string().trim().optional().nullable(),
    maMonHoc: z.string().trim().optional().nullable()
  }),
  params: z.object({}),
  query: z.object({})
});

export const luocDoCapNhatBoFlashcard = z.object({
  body: z.object({
    tenBo: z.string().trim().optional().nullable()
  }),
  params: z.object({ maBo: maTaiNguyen }),
  query: z.object({})
});

export const luocDoXoaBoFlashcard = z.object({
  body: z.object({}),
  params: z.object({ maBo: maTaiNguyen }),
  query: z.object({})
});

const luocDoNoiDungTracNghiem = z.object({
  cauHoi: z.string().trim().optional().nullable(),
  cacLuaChon: z
    .array(
      z.object({
        id: z.string().trim().optional().nullable(),
        noiDung: z.string().trim().optional().nullable()
      })
    )
    .optional()
    .nullable(),
  dapAnDung: z.string().trim().optional().nullable(),
  giaiThich: z.string().trim().optional().nullable()
});

export const luocDoTaoTheFlashcard = z.object({
  body: z.object({
    loaiThe: z.enum(CAC_LOAI_THE_FLASHCARD).optional().nullable(),
    matTruoc: z.string().trim().optional().nullable(),
    matSau: z.string().trim().optional().nullable(),
    cauHoi: z.string().trim().optional().nullable(),
    cauTraLoi: z.string().trim().optional().nullable(),
    tracNghiem: luocDoNoiDungTracNghiem.optional().nullable()
  }),
  params: z.object({ maBo: maTaiNguyen }),
  query: z.object({})
});

export const luocDoTaoTheFlashcardBangAi = z.object({
  body: z.object({
    sourceText: z.string().trim().min(30).max(12000),
    desiredCount: z.coerce.number().int().min(3).max(30).optional().nullable()
  }),
  params: z.object({ maBo: maTaiNguyen }),
  query: z.object({})
});

export const luocDoCapNhatTheFlashcard = z.object({
  body: z.object({
    loaiThe: z.enum(CAC_LOAI_THE_FLASHCARD).optional().nullable(),
    matTruoc: z.string().trim().optional().nullable(),
    matSau: z.string().trim().optional().nullable(),
    cauHoi: z.string().trim().optional().nullable(),
    cauTraLoi: z.string().trim().optional().nullable(),
    tracNghiem: luocDoNoiDungTracNghiem.optional().nullable()
  }),
  params: z.object({ maFlashcard: maTaiNguyen }),
  query: z.object({})
});

export const luocDoXoaTheFlashcard = z.object({
  body: z.object({}),
  params: z.object({ maFlashcard: maTaiNguyen }),
  query: z.object({})
});

export const luocDoBatDauOnTapFlashcard = z.object({
  body: z.object({}),
  params: z.object({ maBo: maTaiNguyen }),
  query: z.object({
    hocLai: z
      .enum(["true", "false", "1", "0"])
      .optional()
      .nullable()
  })
});

export const luocDoCapNhatTienDoFlashcard = z.object({
  body: z.object({
    mucDo: z.enum(CAC_MUC_DO_GHI_NHO_FLASHCARD).or(z.string().trim()).optional().nullable(),
    ketQua: z.enum(CAC_KET_QUA_ON_TAP_FLASHCARD).or(z.string().trim()).optional().nullable(),
    thoiGianPhanHoiMs: z.coerce.number().int().min(0).max(3600000).optional().nullable()
  }),
  params: z.object({ maFlashcard: maTaiNguyen }),
  query: z.object({})
});

export const luocDoThongKeFlashcard = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({})
});

export const luocDoGhiKetQuaPhienFlashcard = z.object({
  body: z.object({
    soCauDung: z.coerce.number().int().min(0).max(10000),
    soCauSai: z.coerce.number().int().min(0).max(10000)
  }),
  params: z.object({ maBo: maTaiNguyen }),
  query: z.object({})
});

type DuLieuDanhSachBo = {
  query: z.infer<typeof luocDoDanhSachBoFlashcard>["query"];
};

type DuLieuTaoBo = {
  body: z.infer<typeof luocDoTaoBoFlashcard>["body"];
};

type DuLieuCapNhatBo = {
  body: z.infer<typeof luocDoCapNhatBoFlashcard>["body"];
  params: { maBo: string };
};

type DuLieuCoMaBo = {
  params: { maBo: string };
};

type DuLieuBatDauOnTap = {
  params: { maBo: string };
  query: z.infer<typeof luocDoBatDauOnTapFlashcard>["query"];
};

type DuLieuGhiKetQuaPhien = {
  body: z.infer<typeof luocDoGhiKetQuaPhienFlashcard>["body"];
  params: { maBo: string };
};

type DuLieuTaoThe = {
  body: z.infer<typeof luocDoTaoTheFlashcard>["body"];
  params: { maBo: string };
};

type DuLieuTaoTheBangAi = {
  body: z.infer<typeof luocDoTaoTheFlashcardBangAi>["body"];
  params: { maBo: string };
};

type DuLieuCapNhatThe = {
  body: z.infer<typeof luocDoCapNhatTheFlashcard>["body"];
  params: { maFlashcard: string };
};

type DuLieuCoMaThe = {
  params: { maFlashcard: string };
};

type DuLieuCapNhatTienDo = {
  body: z.infer<typeof luocDoCapNhatTienDoFlashcard>["body"];
  params: { maFlashcard: string };
};

const layMatTruoc = (body: { matTruoc?: string | null; cauHoi?: string | null }) => body.matTruoc ?? body.cauHoi;
const layMatSau = (body: { matSau?: string | null; cauTraLoi?: string | null }) => body.matSau ?? body.cauTraLoi;

export class BoDieuKhienFlashcard {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  lietKeBo = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { query } = req.duLieuDaXacThuc as DuLieuDanhSachBo;
    const ketQua = await this.boPhuThuoc.xuLyDanhSachBoFlashcard.thucThi({
      actorId,
      maMonHoc: query.maMonHoc
    });

    res.status(200).json(thanhCong(ketQua));
  });

  taoBo = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuTaoBo;
    const ketQua = await this.boPhuThuoc.xuLyTaoBoFlashcard.thucThi({
      actorId,
      ...body
    });

    res.status(201).json(daTao(ketQua));
  });

  capNhatBo = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuCapNhatBo;
    const ketQua = await this.boPhuThuoc.xuLyCapNhatBoFlashcard.thucThi({
      actorId,
      maBo: params.maBo,
      tenBo: body.tenBo
    });

    res.status(200).json(thanhCong(ketQua));
  });

  xoaBo = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { maBo } = (req.duLieuDaXacThuc as DuLieuCoMaBo).params;
    const ketQua = await this.boPhuThuoc.xuLyXoaBoFlashcard.thucThi({ actorId, maBo });

    res.status(200).json(thanhCong(ketQua));
  });

  taoThe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuTaoThe;
    const ketQua = await this.boPhuThuoc.xuLyTaoTheFlashcard.thucThi({
      actorId,
      maBo: params.maBo,
      loaiThe: body.loaiThe ?? undefined,
      matTruoc: layMatTruoc(body),
      matSau: layMatSau(body),
      tracNghiem: body.tracNghiem ?? undefined
    });

    res.status(201).json(daTao(ketQua));
  });

  importThe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const ketQua = await this.boPhuThuoc.xuLyImportFlashcards.thucThi({
      actorId,
      maBo: req.params.maBo,
      file: req.file
        ? {
            tenFile: req.file.originalname,
            mimeType: req.file.mimetype,
            buffer: req.file.buffer
          }
        : null
    });

    res.status(201).json(daTao(ketQua));
  });

  taoTheBangAi = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuTaoTheBangAi;
    const ketQua = await this.boPhuThuoc.xuLyTaoFlashcardBangAi.thucThi({
      actorId,
      maBo: params.maBo,
      sourceText: body.sourceText,
      desiredCount: body.desiredCount
    });

    res.status(201).json(daTao(ketQua));
  });

  aiImportThe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const desiredCountRaw = req.body?.desiredCount;
    const desiredCount =
      desiredCountRaw === undefined || desiredCountRaw === null || desiredCountRaw === ""
        ? null
        : Number(desiredCountRaw);
    const ketQua = await this.boPhuThuoc.xuLyTaoFlashcardTuFile.thucThi({
      actorId,
      maBo: req.params.maBo,
      desiredCount: Number.isFinite(desiredCount) ? desiredCount : null,
      file: req.file
        ? {
            tenFile: req.file.originalname,
            mimeType: req.file.mimetype,
            buffer: req.file.buffer
          }
        : null
    });

    res.status(201).json(daTao(ketQua));
  });

  aiImportTheTuLuan = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const desiredCountRaw = req.body?.desiredCount;
    const desiredCount =
      desiredCountRaw === undefined || desiredCountRaw === null || desiredCountRaw === ""
        ? null
        : Number(desiredCountRaw);
    const ketQua = await this.boPhuThuoc.xuLyTaoFlashcardTuLuanTuFile.thucThi({
      actorId,
      maBo: req.params.maBo,
      desiredCount: Number.isFinite(desiredCount) ? desiredCount : null,
      file: req.file
        ? {
            tenFile: req.file.originalname,
            mimeType: req.file.mimetype,
            buffer: req.file.buffer
          }
        : null
    });

    res.status(201).json(daTao(ketQua));
  });

  batDauOnTap = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { params, query } = req.duLieuDaXacThuc as DuLieuBatDauOnTap;
    const hocLaiTatCa = query.hocLai === "true" || query.hocLai === "1";
    const ketQua = await this.boPhuThuoc.xuLyBatDauOnTapFlashcard.thucThi({
      actorId,
      maBo: params.maBo,
      hocLaiTatCa
    });

    res.status(200).json(thanhCong(ketQua));
  });

  ghiKetQuaPhien = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuGhiKetQuaPhien;
    const ketQua = await this.boPhuThuoc.xuLyGhiKetQuaPhienFlashcard.thucThi({
      actorId,
      maBo: params.maBo,
      soCauDung: body.soCauDung,
      soCauSai: body.soCauSai
    });

    res.status(200).json(thanhCong(ketQua));
  });

  capNhatThe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuCapNhatThe;
    const ketQua = await this.boPhuThuoc.xuLyCapNhatTheFlashcard.thucThi({
      actorId,
      maFlashcard: params.maFlashcard,
      loaiThe: body.loaiThe ?? undefined,
      matTruoc: layMatTruoc(body),
      matSau: layMatSau(body),
      tracNghiem: body.tracNghiem ?? undefined
    });

    res.status(200).json(thanhCong(ketQua));
  });

  xoaThe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { maFlashcard } = (req.duLieuDaXacThuc as DuLieuCoMaThe).params;
    const ketQua = await this.boPhuThuoc.xuLyXoaTheFlashcard.thucThi({ actorId, maFlashcard });

    res.status(200).json(thanhCong(ketQua));
  });

  capNhatTienDo = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body, params } = req.duLieuDaXacThuc as DuLieuCapNhatTienDo;
    const ketQua = await this.boPhuThuoc.xuLyCapNhatTienDoFlashcard.thucThi({
      actorId,
      maFlashcard: params.maFlashcard,
      mucDo: body.mucDo,
      ketQua: body.ketQua,
      thoiGianPhanHoiMs: body.thoiGianPhanHoiMs
    });

    res.status(200).json(thanhCong(ketQua));
  });

  thongKe = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const ketQua = await this.boPhuThuoc.xuLyThongKeFlashcard.thucThi({ actorId });

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
