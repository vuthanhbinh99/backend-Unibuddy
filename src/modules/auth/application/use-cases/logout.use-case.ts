import type { AuditLogRepository } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { TransactionManager } from "../../../../shared/database/transaction.js";
import type { SessionRepository } from "../ports/session.repository.js";
import type { TokenService } from "../ports/token.service.js";

export type LogoutCommand = {
  refreshToken: string;
  actorId?: string | null;
};

type Dependencies = {
  sessionRepository: SessionRepository;
  auditLogRepository: AuditLogRepository;
  tokenService: TokenService;
  transactions: TransactionManager;
};

export class LogoutUseCase {
  constructor(private readonly deps: Dependencies) {}

  async execute(command: LogoutCommand): Promise<void> {
    const refreshTokenHash = this.deps.tokenService.hashRefreshToken(command.refreshToken);

    await this.deps.transactions.withTransaction(async (tx) => {
      await this.deps.sessionRepository.revokeByRefreshTokenHash(refreshTokenHash, tx);
      await this.deps.auditLogRepository.create(
        {
          actorId: command.actorId ?? null,
          level: "INFO",
          action: "AUTH_LOGOUT",
          tableName: "phien_dang_nhap",
          message: "Người dùng đã đăng xuất"
        },
        tx
      );
    });
  }
}
