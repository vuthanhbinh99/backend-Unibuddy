import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import { thanhCong } from "../../../shared/http/api-response.js";

const maVaiTroNguoiNhan = z.enum(["SINH_VIEN", "ADMIN", "QUAN_TRI_VIEN"]);

const luocDoDoiTuongNhan = z
  .object({
    allUsers: z.boolean().optional(),
    roleCodes: z.array(maVaiTroNguoiNhan).min(1).max(3).optional(),
    userIds: z.array(z.string().uuid()).min(1).max(500).optional()
  })
  .refine(
    (target) => target.allUsers === true || Boolean(target.roleCodes?.length) || Boolean(target.userIds?.length),
    "Phai chon doi tuong nhan thong bao"
  );

export const luocDoGuiThongBaoHeThong = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(150),
    content: z.string().trim().min(1).max(4000),
    target: luocDoDoiTuongNhan,
    data: z.record(z.string().max(2000)).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

type DuLieuGuiThongBaoHeThong = z.infer<typeof luocDoGuiThongBaoHeThong>;

export class BoDieuKhienThongBaoHeThong {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  guiThongBaoHeThong = xuLyBatDongBo(async (req: Request, res: Response) => {
    const { body } = req.duLieuDaXacThuc as DuLieuGuiThongBaoHeThong;
    const ketQua = await this.boPhuThuoc.xuLyGuiThongBaoHeThong.thucThi({
      actorId: req.user?.id ?? "",
      title: body.title,
      content: body.content,
      target: body.target,
      data: body.data
    });

    res.status(200).json(thanhCong(ketQua));
  });
}
