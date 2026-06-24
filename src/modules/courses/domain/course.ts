export type HocKySinhVien = {
  maHocKy: string;
  maNguoiDung: string;
  tenHocKy: string;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type HocPhan = {
  maMonHoc: string;
  maHocKy: string;
  maNguoiDung: string;
  maMon: string | null;
  tenMon: string;
  soTinChi: number;
  tenHocKy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ThongKeLienKetHocPhan = {
  lichHoc: number;
  lichThi: number;
  deadline: number;
  thanhPhanDiem: number;
  ghiChu: number;
  taiLieu: number;
  boFlashcard: number;
  tongDuLieuHocTap: number;
  tongLienKet: number;
};

export type DuLieuTaoHocPhan = {
  maHocKy: string;
  maMon: string | null;
  tenMon: string;
  soTinChi: number;
};

export type DuLieuCapNhatHocPhan = DuLieuTaoHocPhan;

export type DuLieuTaoHocKy = {
  maNguoiDung: string;
  tenHocKy: string;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
};

export type KetQuaTimHoacTaoHocPhanImport = {
  monHoc: HocPhan;
  daTao: boolean;
};

export const CANH_BAO_TKB_CHUA_CO_DANH_SACH_MON_HOC =
  "Do bạn chưa làm danh sách môn học. Nếu làm thời khóa biểu trước sẽ không tránh được tình trạng bị lỗi hoặc thiếu môn học do đó hãy thêm thủ công môn học vào danh sách môn ";
