import type { NextFunction, Request, Response } from "express";
import type { AppContainer } from "../../../container.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { asyncHandler } from "../../../shared/http/async-handler.js";
import type { AuthenticatedUser } from "../domain/auth-token-payload.js";

export class AuthMiddleware {
  constructor(private readonly container: AppContainer) {}

  requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    await this.authenticateRequest(req);

    next();
  });

  requireRole = (allowedRoleCodes: readonly string[]) =>
    asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
      const authUser = await this.authenticateRequest(req);

      if (!allowedRoleCodes.includes(authUser.roleCode)) {
        throw AppError.forbidden("Không có quyền truy cập");
      }

      next();
    });

  private async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    const authorization = req.header("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      throw AppError.unauthorized("Thẻ xác thực không hợp lệ");
    }

    const token = authorization.slice("Bearer ".length).trim();
    const authUser = this.container.tokenService.verifyAccessToken(token);
    const user = await this.container.userRepository.findById(authUser.id);

    if (!user) {
      throw AppError.unauthorized("Người dùng không tồn tại");
    }

    if (user.status === "BI_KHOA") {
      throw AppError.locked("Tài khoản đã bị khóa");
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      roleCode: user.role.code
    };

    req.user = authenticatedUser;

    return authenticatedUser;
  }
}
