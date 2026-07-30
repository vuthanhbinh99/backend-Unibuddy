import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { thanhCong } from "../../../shared/http/api-response.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";

export const luocDoChatTroLy = z.object({
  body: z.object({
    message: z.string().trim().min(1).max(2000),
    lichSu: z
      .array(
        z.object({
          vaiTro: z.enum(["user", "assistant"]),
          noiDung: z.string().trim().min(1).max(2000)
        })
      )
      .max(20)
      .default([])
  }),
  params: z.object({}),
  query: z.object({})
});

type DuLieuChatTroLy = {
  body: z.infer<typeof luocDoChatTroLy>["body"];
};

export class BoDieuKhienTroLy {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  chat = xuLyBatDongBo(async (req: Request, res: Response) => {
    const actorId = this.layActorId(req);
    const { body } = req.duLieuDaXacThuc as DuLieuChatTroLy;
    const ketQua = await this.boPhuThuoc.xuLyTraLoiTroLy.thucThi({
      actorId,
      message: body.message,
      lichSu: body.lichSu
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
