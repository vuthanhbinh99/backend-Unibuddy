import type { AuthenticatedUser } from "../../modules/auth/domain/auth-token-payload.js";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthenticatedUser;
      validated?: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
    }
  }
}

export {};
