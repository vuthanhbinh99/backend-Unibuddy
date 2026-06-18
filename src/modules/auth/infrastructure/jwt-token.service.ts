import jwt, { type SignOptions } from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import { cauHinh } from "../../../shared/config/env.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import type { TaiKhoanTokenTruyCap, NguoiDungXacThuc } from "../domain/auth-token-payload.js";
import type { DichVuToken } from "../application/ports/token.service.js";

export class DichVuTokenJwt implements DichVuToken {
  kyTokenTruyCap(user: NguoiDungXacThuc) {
    const duLieu: TaiKhoanTokenTruyCap = {
      sub: user.id,
      email: user.email,
      roleCode: user.roleCode,
      type: "access"
    };

    return jwt.sign(duLieu, cauHinh.jwt.accessSecret, {
      expiresIn: cauHinh.jwt.accessExpiresIn as SignOptions["expiresIn"]
    });
  }

  xacThucTokenTruyCap(token: string): NguoiDungXacThuc {
    try {
      const decoded = jwt.verify(token, cauHinh.jwt.accessSecret);

      if (
        typeof decoded !== "object" ||
        decoded.type !== "access" ||
        typeof decoded.sub !== "string" ||
        typeof decoded.email !== "string" ||
        typeof decoded.roleCode !== "string"
      ) {
        throw LoiUngDung.khongDuocXacThuc("Thẻ Truy cập đã hết hạn hoặc không hợp lệ");
      }

      return {
        id: decoded.sub,
        email: decoded.email,
        roleCode: decoded.roleCode
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }
      throw LoiUngDung.khongDuocXacThuc("Thẻ Truy cập đã hết hạn hoặc không hợp lệ");
    }
  }

  taoTokenLamMoi() {
    return randomBytes(64).toString("base64url");
  }

  bamTokenLamMoi(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  layThoiGianHetHanTokenLamMoi() {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + cauHinh.jwt.refreshTokenExpiresDays);
    return expiresAt;
  }
}



