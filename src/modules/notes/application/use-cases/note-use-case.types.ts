import type { SapXepGhiChu } from "../../domain/notes.js";

export type LenhTaoTepDinhKemGhiChu = {
  downloadUrl: string;
  tenFile: string;
  loaiFile: string;
  dungLuong: number;
};

export type LenhTaoGhiChu = {
  actorId: string;
  tieuDe: string;
  noiDung: string | null;
  maMonHoc: string | null;
  tepDinhKem: LenhTaoTepDinhKemGhiChu[];
};

export type LenhDanhSachGhiChu = {
  actorId: string;
  tuKhoa?: string;
  maMonHoc?: string;
  sort: SapXepGhiChu;
  page: number;
  limit: number;
};

export type LenhCapNhatGhiChu = LenhTaoGhiChu & {
  maGhiChu: string;
  maTaiLieuCanXoa: string[];
};

export type LenhXoaGhiChu = {
  actorId: string;
  maGhiChu: string;
};

export type LenhDinhKemTaiLieuGhiChu = {
  actorId: string;
  maGhiChu: string;
} & LenhTaoTepDinhKemGhiChu;
