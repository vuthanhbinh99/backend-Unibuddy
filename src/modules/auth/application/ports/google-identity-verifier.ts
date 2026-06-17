export type VerifiedGoogleIdentity = {
  subject: string;
  email: string;
  emailVerified: boolean;
  fullName: string | null;
  avatarUrl: string | null;
  audience: string | null;
};

export interface GoogleIdentityVerifier {
  verifyIdToken(idToken: string): Promise<VerifiedGoogleIdentity>;
}
