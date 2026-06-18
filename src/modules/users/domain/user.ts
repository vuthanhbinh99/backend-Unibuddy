export type TrangThaiNguoiDung = "HOAT_DONG" | "BI_KHOA" | "CHUA_XAC_THUC";

export type VaiTroNguoiDung = {
  id: number;
  code: string;
  name: string;
};

export type NguoiDung = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  status: TrangThaiNguoiDung;
  role: VaiTroNguoiDung;
  createdAt: Date;
  updatedAt: Date;
};

export type NguoiDungCongKhai = Omit<NguoiDung, "passwordHash">;

export const anhXaNguoiDungCongKhai = (user: NguoiDung): NguoiDungCongKhai => ({
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



