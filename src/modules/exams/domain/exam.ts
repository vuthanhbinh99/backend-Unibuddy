export type LichThi = {
  maLichThi: string;
  maMonHoc: string;
  maHocKy: string;
  maNguoiDung: string;
  maMon: string | null;
  tenMon: string;
  tenHocKy: string;
  thoiGianThi: Date;
  phongThi: string | null;
  diaDiemThi: string | null;
  soNhacNho: number;
};

export type DuLieuLichThi = {
  maMonHoc: string;
  thoiGianThi: Date;
  phongThi: string | null;
  diaDiemThi: string | null;
};

export type MonHocChoLichThi = {
  maMonHoc: string;
  maHocKy: string;
  maMon: string | null;
  tenMon: string;
  tenHocKy: string;
};

export type DongImportLichThi = Record<string, unknown>;

export type MappingCotImportLichThi = {
  maMonHoc?: string;
  maMon?: string;
  tenMon?: string;
  thoiGianThi?: string;
  ngayThi?: string;
  gioBatDau?: string;
  phongThi?: string;
  diaDiemThi?: string;
};

export type DuLieuImportLichThi = {
  rowIndex: number;
  maMonHoc: string;
  maMon: string | null;
  tenMon: string;
  thoiGianThi: Date;
  phongThi: string | null;
  diaDiemThi: string | null;
};

export type DongPreviewImportLichThi = {
  rowIndex: number;
  hopLe: boolean;
  loi: string[];
  daCoLichThi: boolean;
  lichThi: DuLieuImportLichThi | null;
};

export type NhacNhoLichThiDenHan = {
  maNhacNho: string;
  maNguoiDung: string;
  maLichThi: string;
  thoiGianNhac: Date;
  maMon: string | null;
  tenMon: string;
  thoiGianThi: Date;
  phongThi: string | null;
  diaDiemThi: string | null;
};
