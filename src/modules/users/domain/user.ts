export type TrangThaiNguoiDung = "HOAT_DONG" | "BI_KHOA" | "CHUA_XAC_THUC" | "CHO_DOI_MAT_KHAU";

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
  temporaryPasswordCreatedAt: Date | null;
  role: VaiTroNguoiDung;
  createdAt: Date;
  updatedAt: Date;
};

export type NguoiDungCongKhai = Omit<NguoiDung, "passwordHash" | "temporaryPasswordCreatedAt">;

export type NguoiDungQuanTri = Omit<NguoiDung, "passwordHash">;

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

export const anhXaNguoiDungQuanTri = (user: NguoiDung): NguoiDungQuanTri => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  phoneNumber: user.phoneNumber,
  avatarUrl: user.avatarUrl,
  status: user.status,
  temporaryPasswordCreatedAt: user.temporaryPasswordCreatedAt,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});



