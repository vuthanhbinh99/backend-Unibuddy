export type DanhTinhGoogleDaXacMinh = {
  subject: string;
  email: string;
  emailDaXacThuc: boolean;
  fullName: string | null;
  avatarUrl: string | null;
  audience: string | null;
};

export interface BoKiemTraDanhTinhGoogle {
  xacThucIdToken(idToken: string): Promise<DanhTinhGoogleDaXacMinh>;
}



