export type PhienDangNhap = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  fcmToken: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastActiveAt: Date;
  createdAt: Date;
};

export type PhienDangNhapCongKhai = {
  id: string;
  deviceType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  lastActiveAt: Date;
  createdAt: Date;
  isCurrent: boolean;
};

export type DuLieuTaoPhienDangNhap = {
  userId: string;
  refreshTokenHash: string;
  fcmToken?: string | null;
  deviceType?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
};



