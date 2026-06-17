import type { QueryExecutor } from "../../../../shared/database/database.js";
import type { CreateSessionData, Session } from "../../domain/session.js";

export interface SessionRepository {
  create(data: CreateSessionData, executor?: QueryExecutor): Promise<Session>;
  findActiveByRefreshTokenHash(
    refreshTokenHash: string,
    executor?: QueryExecutor
  ): Promise<Session | null>;
  clearFcmToken(fcmToken: string, executor?: QueryExecutor): Promise<void>;
  revokeByRefreshTokenHash(refreshTokenHash: string, executor?: QueryExecutor): Promise<void>;
  revokeActiveSessionsByUserId(userId: string, executor?: QueryExecutor): Promise<void>;
}
