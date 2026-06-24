import type {
  HocKyDiemSo,
  MonHocBangDiem,
  MonHocDiemSo,
  MucQuyCheHocLuc,
  MucQuyDoiDiem,
  ThanhPhanDiem
} from "../../domain/grade.js";
import { lapBangDiemMonHoc, tinhTongKetBangDiem } from "../services/grade-calculation.service.js";

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const SAI_SO_TRONG_SO = 0.01;

export const laUuid = (value: string) => UUID_PATTERN.test(value);

export const chuanHoaTenThanhPhan = (value?: string | null) => value?.trim().replace(/\s+/g, " ") ?? "";

export const chuanHoaMaMon = (value?: string | null) => value?.trim() || null;

export const laDiemHopLe = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 10;

export const laTrongSoHopLe = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 100;

export const layNgayHienTaiIso = () => {
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]));

  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const hocKyDaKetThuc = (hocKy: HocKyDiemSo, ngayHienTai = layNgayHienTaiIso()) =>
  Boolean(hocKy.ngayKetThuc && hocKy.ngayKetThuc < ngayHienTai);

export const gomThanhPhanTheoMon = (thanhPhanTheoMon: Array<{ maMonHoc: string; thanhPhan: ThanhPhanDiem[] }>) => {
  const result = new Map<string, ThanhPhanDiem[]>();

  for (const item of thanhPhanTheoMon) {
    result.set(item.maMonHoc, item.thanhPhan);
  }

  return result;
};

export const lapBangDiemTuDuLieu = (
  monHoc: MonHocDiemSo[],
  thanhPhanTheoMon: Map<string, ThanhPhanDiem[]>,
  thangDiem: MucQuyDoiDiem[],
  quyCheHocLuc: MucQuyCheHocLuc[]
) => {
  const items = lapBangDiemMonHoc(monHoc, thanhPhanTheoMon, thangDiem);
  const tongKet = tinhTongKetBangDiem(items, quyCheHocLuc);

  return {
    items,
    tongKet
  };
};

export const tinhTongTinChiConThieu = (items: MonHocBangDiem[]) =>
  items
    .filter((item) => item.ketQua.diemHe4 === null || !item.ketQua.dayDuDiem)
    .reduce((tong, item) => tong + item.soTinChi, 0);
