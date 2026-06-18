import type { NextFunction, Request, Response } from "express";
import type { BoPhuThuocUngDung } from "../../../container.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import { xuLyBatDongBo } from "../../../shared/http/async-handler.js";
import type { NguoiDungXacThuc } from "../domain/auth-token-payload.js";

export class BoTrungGianXacThuc {
  constructor(private readonly boPhuThuoc: BoPhuThuocUngDung) {}

  yeuCauXacThuc = xuLyBatDongBo(async (req: Request, _res: Response, next: NextFunction) => {
    await this.xacThucYeuCau(req);

    next();
  });

  yeuCauVaiTro = (allowedRoleCodes: readonly string[]) =>
    xuLyBatDongBo(async (req: Request, _res: Response, next: NextFunction) => {
      const authUser = await this.xacThucYeuCau(req);

      if (!allowedRoleCodes.includes(authUser.roleCode)) {
        throw LoiUngDung.khongCoQuyen("Không có quyền truy cập");
      }

      next();
    });

  private async xacThucYeuCau(req: Request): Promise<NguoiDungXacThuc> {
    const authorization = req.header("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      throw LoiUngDung.khongDuocXacThuc("Thẻ xác thực không hợp lệ");
    }

    const token = authorization.slice("Bearer ".length).trim();
    const authUser = this.boPhuThuoc.dichVuToken.xacThucTokenTruyCap(token);
    const user = await this.boPhuThuoc.khoNguoiDung.timTheoMa(authUser.id);

    if (!user) {
      throw LoiUngDung.khongDuocXacThuc("Người dùng không tồn tại");
    }

    if (user.status === "BI_KHOA") {
      throw LoiUngDung.biKhoa("Tài khoản đã bị khóa");
    }

    const nguoiDungXacThuc: NguoiDungXacThuc = {
      id: user.id,
      email: user.email,
      roleCode: user.role.code
    };

    req.user = nguoiDungXacThuc;

    return nguoiDungXacThuc;
  }
}



