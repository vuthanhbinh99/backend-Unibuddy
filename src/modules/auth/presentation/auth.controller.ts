import type { Request, Response } from "express";
import { z } from "zod";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import { daTao, thanhCong } from "../../../shared/http/api-response.js";

export const luocDoDangNhap = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    newPassword: z.string().min(8).optional(),
    fcmToken: z.string().min(1).optional(),
    deviceType: z.string().min(1).optional()
  })
});

export const luocDoDangNhapGoogle = z.object({
  body: z.object({
    idToken: z.string().min(1),
    fcmToken: z.string().min(1).optional(),
    deviceType: z.string().min(1).optional()
  })
});

export const luocDoLamMoiToken = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
    fcmToken: z.string().min(1).optional(),
    deviceType: z.string().min(1).optional()
  })
});

export const luocDoDangXuat = z.object({
  body: z.object({
    refreshToken: z.string().min(1)
  })
});

export const luocDoYeuCauQuenMatKhau = z.object({
  body: z.object({
    email: z.string().email()
  })
});

export const luocDoXacThucMaQuenMatKhau = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().regex(/^\d{6}$/)
  })
});

export const luocDoDatLaiMatKhau = z.object({
  body: z.object({
    resetToken: z.string().min(1),
    newPassword: z.string().min(8)
  })
});

type DuLieuDangNhap = z.infer<typeof luocDoDangNhap>["body"];
type DuLieuDangNhapGoogle = z.infer<typeof luocDoDangNhapGoogle>["body"];
type DuLieuLamMoiToken = z.infer<typeof luocDoLamMoiToken>["body"];
type DuLieuDangXuat = z.infer<typeof luocDoDangXuat>["body"];
type DuLieuYeuCauQuenMatKhau = z.infer<typeof luocDoYeuCauQuenMatKhau>["body"];
type DuLieuXacThucMaQuenMatKhau = z.infer<typeof luocDoXacThucMaQuenMatKhau>["body"];
type DuLieuDatLaiMatKhau = z.infer<typeof luocDoDatLaiMatKhau>["body"];

export class BoDieuKhienXacThuc {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  dangNhap = xuLyBatDongBo(async (req: Request, res: Response) => {
    const body = (req.duLieuDaXacThuc as { body: DuLieuDangNhap }).body;

    const ketQua = await this.boPhuThuoc.xuLyDangNhap.thucThi({
      email: body.email,
      password: body.password,
      newPassword: body.newPassword,
      device: {
        fcmToken: body.fcmToken ?? null,
        deviceType: body.deviceType ?? null,
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? null
      }
    });

    res.status(200).json(thanhCong(ketQua));
  });

  dangNhapGoogle = xuLyBatDongBo(async (req: Request, res: Response) => {
    const body = (req.duLieuDaXacThuc as { body: DuLieuDangNhapGoogle }).body;

    const ketQua = await this.boPhuThuoc.xuLyDangNhapGoogle.thucThi({
      idToken: body.idToken,
      device: {
        fcmToken: body.fcmToken ?? null,
        deviceType: body.deviceType ?? null,
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? null
      }
    });

    res.status(200).json(thanhCong(ketQua));
  });

  lamMoiToken = xuLyBatDongBo(async (req: Request, res: Response) => {
    const body = (req.duLieuDaXacThuc as { body: DuLieuLamMoiToken }).body;

    const ketQua = await this.boPhuThuoc.xuLyLamMoiToken.thucThi({
      refreshToken: body.refreshToken,
      device: {
        fcmToken: body.fcmToken ?? null,
        deviceType: body.deviceType ?? null,
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? null
      }
    });

    res.status(201).json(daTao(ketQua));
  });

  dangXuat = xuLyBatDongBo(async (req: Request, res: Response) => {
    const body = (req.duLieuDaXacThuc as { body: DuLieuDangXuat }).body;

    await this.boPhuThuoc.xuLyDangXuat.thucThi({
      refreshToken: body.refreshToken,
      actorId: req.user?.id ?? null
    });

    res.status(200).json(thanhCong({ loggedOut: true }));
  });

  yeuCauQuenMatKhau = xuLyBatDongBo(async (req: Request, res: Response) => {
    const body = (req.duLieuDaXacThuc as { body: DuLieuYeuCauQuenMatKhau }).body;

    const ketQua = await this.boPhuThuoc.xuLyYeuCauQuenMatKhau.thucThi({
      email: body.email
    });

    res.status(200).json(thanhCong(ketQua));
  });

  xacThucMaQuenMatKhau = xuLyBatDongBo(async (req: Request, res: Response) => {
    const body = (req.duLieuDaXacThuc as { body: DuLieuXacThucMaQuenMatKhau }).body;

    const ketQua = await this.boPhuThuoc.xuLyXacThucMaQuenMatKhau.thucThi({
      email: body.email,
      code: body.code
    });

    res.status(200).json(thanhCong(ketQua));
  });

  datLaiMatKhau = xuLyBatDongBo(async (req: Request, res: Response) => {
    const body = (req.duLieuDaXacThuc as { body: DuLieuDatLaiMatKhau }).body;

    const ketQua = await this.boPhuThuoc.xuLyDatLaiMatKhau.thucThi({
      resetToken: body.resetToken,
      newPassword: body.newPassword
    });

    res.status(200).json(thanhCong(ketQua));
  });
}



