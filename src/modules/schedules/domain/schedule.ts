export type LichHoc = {
  maLichHoc: string;
  maMonHoc: string;
  maHocKy: string;
  maNguoiDung: string;
  maMon: string | null;
  tenMon: string;
  tenHocKy: string;
  thu: number;
  tietBatDau: number;
  soTiet: number;
  phongHoc: string | null;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
};

export type DuLieuLichHoc = {
  maMonHoc: string;
  thu: number;
  tietBatDau: number;
  soTiet: number;
  phongHoc: string | null;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
};

export type MonHocCuaSinhVien = {
  maMonHoc: string;
  maHocKy: string;
  maMon: string | null;
  tenMon: string;
  soTinChi: number;
  tenHocKy: string;
};

export type NguCanhMonHocTrongLichSinhVien = {
  maMonHoc: string;
  maMon: string | null;
  tenMon: string;
  maTruong: number | null;
};

export type XungDotLichHoc = Pick<
  LichHoc,
  "maLichHoc" | "maMonHoc" | "maMon" | "tenMon" | "thu" | "tietBatDau" | "soTiet" | "phongHoc" | "ngayBatDau" | "ngayKetThuc"
>;

export type DongImportThoiKhoaBieu = Record<string, unknown>;

export type MappingCotImportThoiKhoaBieu = {
  maMonHoc?: string;
  maMon?: string;
  tenMon?: string;
  thu?: string;
  tietBatDau?: string;
  soTiet?: string;
  soTinChi?: string;
  phongHoc?: string;
  ngayBatDau?: string;
  ngayKetThuc?: string;
};

export type DuLieuImportLichHoc = Omit<DuLieuLichHoc, "maMonHoc"> & {
  rowIndex: number;
  maMonHoc: string | null;
  maMon: string | null;
  tenMon: string;
  soTinChi: number | null;
  tuDongTaoMonHoc: boolean;
};

export type DongPreviewImportThoiKhoaBieu = {
  rowIndex: number;
  hopLe: boolean;
  trungLich: boolean;
  loi: string[];
  lichHoc: DuLieuImportLichHoc | null;
  xungDot: XungDotLichHoc[];
};
