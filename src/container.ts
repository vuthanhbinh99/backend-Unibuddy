import { BcryptPasswordHasher } from "./modules/auth/infrastructure/bcrypt-password-hasher.js";
import { GoogleTokenInfoVerifier } from "./modules/auth/infrastructure/google-token-info.verifier.js";
import { JwtTokenService } from "./modules/auth/infrastructure/jwt-token.service.js";
import { PostgresSessionRepository } from "./modules/auth/infrastructure/postgres-session.repository.js";
import { GoogleLoginUseCase } from "./modules/auth/application/use-cases/google-login.use-case.js";
import { LoginUseCase } from "./modules/auth/application/use-cases/login.use-case.js";
import { LogoutUseCase } from "./modules/auth/application/use-cases/logout.use-case.js";
import { RefreshTokenUseCase } from "./modules/auth/application/use-cases/refresh-token.use-case.js";
import { PostgresAuditLogRepository } from "./modules/audit-logs/infrastructure/postgres-audit-log.repository.js";
import { GetCurrentUserUseCase } from "./modules/users/application/use-cases/get-current-user.use-case.js";
import { PostgresUserRepository } from "./modules/users/infrastructure/postgres-user.repository.js";
import { config } from "./shared/config/env.js";
import { PostgresConnectionPool } from "./shared/database/postgres.js";
import { PostgresTransactionManager } from "./shared/database/transaction.js";

let container: AppContainer | null = null;

export type AppContainer = ReturnType<typeof createContainer>;

const createContainer = () => {
  const db = new PostgresConnectionPool();
  const transactions = new PostgresTransactionManager(db);

  const userRepository = new PostgresUserRepository(db);
  const sessionRepository = new PostgresSessionRepository(db);
  const auditLogRepository = new PostgresAuditLogRepository(db);

  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService();
  const googleIdentityVerifier = new GoogleTokenInfoVerifier(config.auth.googleClientIds);

  const loginUseCase = new LoginUseCase({
    userRepository,
    sessionRepository,
    auditLogRepository,
    passwordHasher,
    tokenService,
    transactions
  });

  const googleLoginUseCase = new GoogleLoginUseCase({
    userRepository,
    sessionRepository,
    auditLogRepository,
    passwordHasher,
    tokenService,
    transactions,
    googleIdentityVerifier,
    defaultStudentRoleCode: config.auth.defaultStudentRoleCode
  });

  const refreshTokenUseCase = new RefreshTokenUseCase({
    userRepository,
    sessionRepository,
    auditLogRepository,
    tokenService,
    transactions
  });

  const logoutUseCase = new LogoutUseCase({
    sessionRepository,
    auditLogRepository,
    tokenService,
    transactions
  });

  const getCurrentUserUseCase = new GetCurrentUserUseCase({ userRepository });

  return {
    db,
    transactions,
    userRepository,
    sessionRepository,
    auditLogRepository,
    passwordHasher,
    tokenService,
    googleIdentityVerifier,
    loginUseCase,
    googleLoginUseCase,
    refreshTokenUseCase,
    logoutUseCase,
    getCurrentUserUseCase
  };
};

export const buildContainer = () => {
  container ??= createContainer();
  return container;
};
