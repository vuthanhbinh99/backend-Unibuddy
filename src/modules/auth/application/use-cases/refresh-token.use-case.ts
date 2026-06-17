import type { AuditLogRepository } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { UserRepository } from "../../../users/application/ports/user.repository.js";
import type { TransactionManager } from "../../../../shared/database/transaction.js";
import { AppError } from "../../../../shared/errors/app-error.js";
import type { SessionRepository } from "../ports/session.repository.js";
import type { TokenService } from "../ports/token.service.js";

export type RefreshTokenCommand = {
  refreshToken: string;
  device?: {
    fcmToken?: string | null;
    deviceType?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

export type RefreshTokenResult = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

type Dependencies = {
  userRepository: UserRepository;
  sessionRepository: SessionRepository;
  auditLogRepository: AuditLogRepository;
  tokenService: TokenService;
  transactions: TransactionManager;
};

export class RefreshTokenUseCase {
  constructor(private readonly deps: Dependencies) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    const oldRefreshTokenHash = this.deps.tokenService.hashRefreshToken(command.refreshToken);
    const session = await this.deps.sessionRepository.findActiveByRefreshTokenHash(
      oldRefreshTokenHash
    );

    if (!session) {
      throw AppError.unauthorized("refresh token bị sai hoặc hết hạn");
    }

    const user = await this.deps.userRepository.findById(session.userId);

    if (!user) {
      throw AppError.unauthorized("Người dùng sở hữu phiên đăng nhập không tồn tại");
    }

    if (user.status === "BI_KHOA") {
      await this.deps.transactions.withTransaction(async (tx) => {
        await this.deps.sessionRepository.revokeActiveSessionsByUserId(user.id, tx);
        await this.deps.auditLogRepository.create(
          {
            actorId: user.id,
            level: "WARNING",
            action: "AUTH_LOCKED_ACCOUNT_REFRESH_BLOCKED",
            tableName: "nguoi_dung",
            recordId: user.id,
            message: "Tài khoản đã bị khóa cố gắng làm mới token"
          },
          tx
        );
      });

      throw AppError.locked("Tài khoản đã bị khóa và không thể làm mới token");
    }

    const accessToken = this.deps.tokenService.signAccessToken({
      id: user.id,
      email: user.email,
      roleCode: user.role.code
    });

    const newRefreshToken = this.deps.tokenService.generateRefreshToken();
    const newRefreshTokenHash = this.deps.tokenService.hashRefreshToken(newRefreshToken);
    const refreshTokenExpiresAt = this.deps.tokenService.getRefreshTokenExpiresAt();

    await this.deps.transactions.withTransaction(async (tx) => {
      await this.deps.sessionRepository.revokeByRefreshTokenHash(oldRefreshTokenHash, tx);

      if (command.device?.fcmToken) {
        await this.deps.sessionRepository.clearFcmToken(command.device.fcmToken, tx);
      }

      await this.deps.sessionRepository.create(
        {
          userId: user.id,
          refreshTokenHash: newRefreshTokenHash,
          fcmToken: command.device?.fcmToken ?? session.fcmToken,
          deviceType: command.device?.deviceType ?? session.deviceType,
          ipAddress: command.device?.ipAddress ?? session.ipAddress,
          userAgent: command.device?.userAgent ?? session.userAgent,
          expiresAt: refreshTokenExpiresAt
        },
        tx
      );

      await this.deps.auditLogRepository.create(
        {
          actorId: user.id,
          level: "INFO",
          action: "AUTH_REFRESH_SUCCESS",
          tableName: "phien_dang_nhap",
          message: "Người dùng đã làm mới phiên xác thực thành công"
        },
        tx
      );
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt
    };
  }
}
