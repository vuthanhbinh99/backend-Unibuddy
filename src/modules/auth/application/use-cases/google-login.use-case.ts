import type { AuditLogRepository } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { UserRepository } from "../../../users/application/ports/user.repository.js";
import { type PublicUser, toPublicUser, type User } from "../../../users/domain/user.js";
import type { TransactionManager } from "../../../../shared/database/transaction.js";
import { AppError } from "../../../../shared/errors/app-error.js";
import type { GoogleIdentityVerifier } from "../ports/google-identity-verifier.js";
import type { PasswordHasher } from "../ports/password-hasher.js";
import type { SessionRepository } from "../ports/session.repository.js";
import type { TokenService } from "../ports/token.service.js";

export type GoogleLoginCommand = {
  idToken: string;
  device?: {
    fcmToken?: string | null;
    deviceType?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

export type GoogleLoginResult = {
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
  googleIdentityVerifier: GoogleIdentityVerifier;
  defaultStudentRoleCode: string;
};

export class GoogleLoginUseCase {
  constructor(private readonly deps: Dependencies) {}

  async execute(command: GoogleLoginCommand): Promise<GoogleLoginResult> {
    const googleIdentity = await this.deps.googleIdentityVerifier.verifyIdToken(command.idToken);

    const user =
      (await this.deps.userRepository.findByEmail(googleIdentity.email)) ??
      (await this.createStudentFromGoogleIdentity({
        email: googleIdentity.email,
        fullName: googleIdentity.fullName,
        avatarUrl: googleIdentity.avatarUrl,
        googleSubject: googleIdentity.subject
      }));

    if (user.status === "BI_KHOA") {
      await this.deps.transactions.withTransaction(async (tx) => {
        await this.deps.sessionRepository.revokeActiveSessionsByUserId(user.id, tx);
        await this.deps.auditLogRepository.create(
          {
            actorId: user.id,
            level: "WARNING",
            action: "AUTH_LOCKED_ACCOUNT_GOOGLE_LOGIN_BLOCKED",
            tableName: "nguoi_dung",
            recordId: user.id,
            message: "Locked account attempted Google login"
          },
          tx
        );
      });

      throw AppError.locked("Account has been locked");
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
          action: "AUTH_GOOGLE_LOGIN_SUCCESS",
          tableName: "phien_dang_nhap",
          message: "User logged in with Google",
          metadata: {
            googleSubject: googleIdentity.subject,
            audience: googleIdentity.audience
          }
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

  private async createStudentFromGoogleIdentity(input: {
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    googleSubject: string;
  }): Promise<User> {
    const generatedPasswordHash = await this.deps.passwordHasher.hash(
      this.deps.tokenService.generateRefreshToken()
    );

    return this.deps.transactions.withTransaction(async (tx) => {
      const existingUser = await this.deps.userRepository.findByEmail(input.email, tx);

      if (existingUser) {
        return existingUser;
      }

      const createdUser = await this.deps.userRepository.create(
        {
          email: input.email,
          passwordHash: generatedPasswordHash,
          fullName: input.fullName ?? input.email.split("@")[0],
          avatarUrl: input.avatarUrl,
          roleCode: this.deps.defaultStudentRoleCode,
          status: "HOAT_DONG"
        },
        tx
      );

      await this.deps.auditLogRepository.create(
        {
          actorId: createdUser.id,
          level: "INFO",
          action: "AUTH_GOOGLE_ACCOUNT_CREATED",
          tableName: "nguoi_dung",
          recordId: createdUser.id,
          message: "Student account created from Google login",
          metadata: {
            email: input.email,
            googleSubject: input.googleSubject,
            roleCode: this.deps.defaultStudentRoleCode
          }
        },
        tx
      );

      return createdUser;
    });
  }
}
