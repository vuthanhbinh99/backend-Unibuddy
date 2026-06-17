import type { AuditLogRepository } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { type PublicUser, toPublicUser } from "../../../users/domain/user.js";
import type { UserRepository } from "../../../users/application/ports/user.repository.js";
import type { TransactionManager } from "../../../../shared/database/transaction.js";
import { AppError } from "../../../../shared/errors/app-error.js";
import type { PasswordHasher } from "../ports/password-hasher.js";
import type { SessionRepository } from "../ports/session.repository.js";
import type { TokenService } from "../ports/token.service.js";

export type LoginCommand = {
  email: string;
  password: string;
  device?: {
    fcmToken?: string | null;
    deviceType?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

export type LoginResult = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

type Dependencies = {
  userRepository: UserRepository;
  sessionRepository: SessionRepository;
  auditLogRepository: AuditLogRepository;
  passwordHasher: PasswordHasher;
  tokenService: TokenService;
  transactions: TransactionManager;
};

export class LoginUseCase {
  constructor(private readonly deps: Dependencies) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const user = await this.deps.userRepository.findByEmail(command.email);

    if (!user) {
      await this.deps.auditLogRepository.create({
        actorId: null,
        level: "WARNING",
        action: "AUTH_LOGIN_FAILED",
        tableName: "nguoi_dung",
        message: "Đăng nhập thất bại do tài khoản không tồn tại",
        metadata: { email: command.email }
      });
      throw AppError.unauthorized("Sai tài khoản hoặc mật khẩu");
    }

    const isPasswordValid = await this.deps.passwordHasher.compare(
      command.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      await this.deps.auditLogRepository.create({
        actorId: user.id,
        level: "WARNING",
        action: "AUTH_LOGIN_FAILED",
        tableName: "nguoi_dung",
        recordId: user.id,
        message: "Đăng nhập thất bại do mật khẩu không đúng"
      });
      throw AppError.unauthorized("Sai tài khoản hoặc mật khẩu");
    }

    if (user.status === "BI_KHOA") {
      await this.deps.transactions.withTransaction(async (tx) => {
        await this.deps.sessionRepository.revokeActiveSessionsByUserId(user.id, tx);
        await this.deps.auditLogRepository.create(
          {
            actorId: user.id,
            level: "WARNING",
            action: "AUTH_LOCKED_ACCOUNT_LOGIN_BLOCKED",
            tableName: "nguoi_dung",
            recordId: user.id,
            message: "Tài khoản đã bị khóa cố gắng đăng nhập"
          },
          tx
        );
      });

      throw AppError.locked("Tài khoản đã bị khóa và không thể đăng nhập");
    }

    const accessToken = this.deps.tokenService.signAccessToken({
      id: user.id,
      email: user.email,
      roleCode: user.role.code
    });

    const refreshToken = this.deps.tokenService.generateRefreshToken();
    const refreshTokenHash = this.deps.tokenService.hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = this.deps.tokenService.getRefreshTokenExpiresAt();

    await this.deps.transactions.withTransaction(async (tx) => {
      if (command.device?.fcmToken) {
        await this.deps.sessionRepository.clearFcmToken(command.device.fcmToken, tx);
      }

      await this.deps.sessionRepository.create(
        {
          userId: user.id,
          refreshTokenHash,
          fcmToken: command.device?.fcmToken ?? null,
          deviceType: command.device?.deviceType ?? null,
          ipAddress: command.device?.ipAddress ?? null,
          userAgent: command.device?.userAgent ?? null,
          expiresAt: refreshTokenExpiresAt
        },
        tx
      );

      await this.deps.auditLogRepository.create(
        {
          actorId: user.id,
          level: "INFO",
          action: "AUTH_LOGIN_SUCCESS",
          tableName: "phien_dang_nhap",
          message: "Người dùng đăng nhập thành công"
        },
        tx
      );
    });

    return {
      user: toPublicUser(user),
      accessToken,
      refreshToken,
      refreshTokenExpiresAt
    };
  }
}
