export type ThanhPhanDiem = {
  maThanhPhan: string;
  maMonHoc: string;
  tenThanhPhan: string;
  trongSo: number;
  diem: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type HocKyDiemSo = {
  maHocKy: string;
  maNguoiDung: string;
  tenHocKy: string;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
};

export type MonHocDiemSo = {
  maMonHoc: string;
  maHocKy: string;
  maNguoiDung: string;
  maMon: string | null;
  tenMon: string;
  soTinChi: number;
  tenHocKy: string;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
  maTruongCode: string | null;
};

export type MucQuyDoiDiem = {
  diemTu: number;
  diemDen: number;
  diemChu: string;
  he4: number;
};

export type MucQuyCheHocLuc = {
  xepLoai: string;
  gpaTu: number;
  gpaDen: number;
};

export type KetQuaTinhMonHoc = {
  tongTrongSo: number;
  duTrongSo: boolean;
  dayDuDiem: boolean;
  diemTongKetHe10: number | null;
  diemChu: string | null;
  diemHe4: number | null;
};

export type MonHocBangDiem = MonHocDiemSo & {
  thanhPhan: ThanhPhanDiem[];
  ketQua: KetQuaTinhMonHoc;
};

export type TongKetBangDiem = {
  soTinChiDaTinh: number;
  soTinChiConLai: number;
  gpaHocKy: number | null;
  gpaTichLuy: number | null;
  xepLoaiHocLuc: string | null;
};

export type DuLieuTaoThanhPhanDiem = {
  maMonHoc: string;
  tenThanhPhan: string;
  trongSo: number;
  diem: number | null;
};

export type DuLieuUpsertThanhPhanDiem = DuLieuTaoThanhPhanDiem;

export type CauHinhTrongSoDiem = {
  tenThanhPhan: string;
  trongSo: number;
  diem?: number | null;
};

export type DongImportDiemSo = Record<string, unknown>;

export type MappingCotImportDiemSo = {
  maMonHoc?: string;
  maMon?: string;
  tenMon?: string;
  soTinChi?: string;
  tenThanhPhan?: string;
  trongSo?: string;
  diem?: string;
  diemTongKet?: string;
};

export type DuLieuImportDiemSo = {
  rowIndex: number;
  maMonHoc: string | null;
  maMon: string | null;
  tenMon: string;
  soTinChi: number | null;
  tenThanhPhan: string;
  trongSo: number;
  diem: number;
  tuDongTaoMonHoc: boolean;
};

export type DongPreviewImportDiemSo = {
  rowIndex: number;
  hopLe: boolean;
  loi: string[];
  diemSo: DuLieuImportDiemSo | null;
};

