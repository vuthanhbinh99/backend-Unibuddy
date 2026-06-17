export type UserStatus = "HOAT_DONG" | "BI_KHOA" | "CHUA_XAC_THUC";

export type UserRole = {
  id: number;
  code: string;
  name: string;
};

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = Omit<User, "passwordHash">;

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  phoneNumber: user.phoneNumber,
  avatarUrl: user.avatarUrl,
  status: user.status,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});
