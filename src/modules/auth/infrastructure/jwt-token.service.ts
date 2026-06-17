import jwt, { type SignOptions } from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import { config } from "../../../shared/config/env.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { AccessTokenPayload, AuthenticatedUser } from "../domain/auth-token-payload.js";
import type { TokenService } from "../application/ports/token.service.js";

export class JwtTokenService implements TokenService {
  signAccessToken(user: AuthenticatedUser) {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      roleCode: user.roleCode,
      type: "access"
    };

    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as SignOptions["expiresIn"]
    });
  }

  verifyAccessToken(token: string): AuthenticatedUser {
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);

      if (
        typeof decoded !== "object" ||
        decoded.type !== "access" ||
        typeof decoded.sub !== "string" ||
        typeof decoded.email !== "string" ||
        typeof decoded.roleCode !== "string"
      ) {
        throw AppError.unauthorized("Thẻ Truy cập đã hết hạn hoặc không hợp lệ");
      }

      return {
        id: decoded.sub,
        email: decoded.email,
        roleCode: decoded.roleCode
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.unauthorized("Thẻ Truy cập đã hết hạn hoặc không hợp lệ");
    }
  }

  generateRefreshToken() {
    return randomBytes(64).toString("base64url");
  }

  hashRefreshToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  getRefreshTokenExpiresAt() {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshTokenExpiresDays);
    return expiresAt;
  }
}
