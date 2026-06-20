export type MaVaiTroNguoiNhanThongBao = "SINH_VIEN" | "ADMIN" | "QUAN_TRI_VIEN";

export type BoLocNguoiNhanThongBao = {
  allUsers?: boolean;
  roleCodes?: MaVaiTroNguoiNhanThongBao[];
  userIds?: string[];
};

export type NguoiNhanThongBao = {
  userId: string;
  email: string;
  fullName: string;
  roleCode: MaVaiTroNguoiNhanThongBao;
};

export type FcmTokenNguoiNhan = {
  userId: string;
  token: string;
};

export type BanGhiThongBaoHeThong = {
  id: string;
  recipientId: string;
};
