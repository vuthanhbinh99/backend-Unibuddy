import type { AuthenticatedUser } from "../../domain/auth-token-payload.js";

export interface TokenService {
  signAccessToken(user: AuthenticatedUser): string;
  verifyAccessToken(token: string): AuthenticatedUser;
  generateRefreshToken(): string;
  hashRefreshToken(token: string): string;
  getRefreshTokenExpiresAt(): Date;
}
