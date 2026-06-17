import { AppError } from "../../../shared/errors/app-error.js";
import type {
  GoogleIdentityVerifier,
  VerifiedGoogleIdentity
} from "../application/ports/google-identity-verifier.js";

type GoogleTokenInfoResponse = {
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
  aud?: string;
};

export class GoogleTokenInfoVerifier implements GoogleIdentityVerifier {
  constructor(private readonly allowedClientIds: readonly string[]) {}

  async verifyIdToken(idToken: string): Promise<VerifiedGoogleIdentity> {
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
      );

      if (!response.ok) {
        throw AppError.unauthorized("Thẻ Google không hợp lệ");
      }

      const payload = (await response.json()) as GoogleTokenInfoResponse;

      if (!payload.sub || !payload.email) {
        throw AppError.unauthorized("Thẻ Google không hợp lệ");
      }

      const emailVerified =
        payload.email_verified === true || payload.email_verified === "true";

      if (!emailVerified) {
        throw AppError.unauthorized("Email Google chưa được xác thực");
      }

      if (
        this.allowedClientIds.length > 0 &&
        (!payload.aud || !this.allowedClientIds.includes(payload.aud))
      ) {
        throw AppError.unauthorized("Thẻ Google không hợp lệ");
      }

      return {
        subject: payload.sub,
        email: payload.email,
        emailVerified,
        fullName: payload.name ?? null,
        avatarUrl: payload.picture ?? null,
        audience: payload.aud ?? null
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw AppError.unauthorized("Không thể xác minh mã thông báo Google");
    }
  }
}
