export type TepDinhKemGhiChu = {
  maTaiLieu: string;
  maGhiChu: string;
  nguoiTaiLen: string;
  duongDanLuuTru: string;
  tenFile: string;
  loaiFile: string | null;
  dungLuong: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GhiChu = {
  maGhiChu: string;
  maNguoiDung: string;
  maMonHoc: string | null;
  tieuDe: string;
  noiDung: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GhiChuChiTiet = GhiChu & {
  tepDinhKem: TepDinhKemGhiChu[];
};

export type GhiChuDanhSach = GhiChu & {
  soTepDinhKem: number;
};

export type SapXepGhiChu =
  | "updated_desc"
  | "updated_asc"
  | "created_desc"
  | "created_asc"
  | "title_asc"
  | "title_desc";
