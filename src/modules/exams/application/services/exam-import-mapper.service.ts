import type { DongImportLichThi, DuLieuLichThi, MappingCotImportLichThi } from "../../domain/exam.js";

export type DongImportLichThiDaChuanHoa = Partial<Omit<DuLieuLichThi, "maMonHoc">> & {
  rowIndex: number;
  maMonHoc: string | null;
  maMon: string | null;
  tenMon: string | null;
  loi: string[];
};

const BO_COT_IMPORT = {
  maMonHoc: ["ma mon hoc uuid", "ma_mon_hoc uuid", "uuid mon hoc", "ma hoc phan uuid"],
  maMon: ["ma mh", "ma mon", "ma_mon", "ma hoc phan", "ma hp", "code"],
  tenMon: ["ten mon hoc", "ten mon", "mon hoc", "hoc phan", "ten hoc phan"],
  thoiGianThi: ["thoi gian thi", "ngay gio thi", "lich thi"],
  ngayThi: ["ngay thi", "ngay", "date"],
  gioBatDau: ["gio bat dau", "gio thi", "bat dau", "time"],
  phongThi: ["phong thi", "phong"],
  diaDiemThi: ["dia diem thi", "dia diem", "co so", "noi thi"]
} satisfies Record<keyof MappingCotImportLichThi, string[]>;

const chuanHoaChuoi = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[đĐ]/g, (char) => (char === "Đ" ? "D" : "d"))
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const layText = (row: DongImportLichThi, column?: string) => {
  if (!column) {
    return "";
  }

  const value = row[column];
  return value === null || value === undefined ? "" : String(value).trim();
};

const cotGanDung = (headers: string[], aliases: string[]) => {
  const normalizedAliases = aliases.map(chuanHoaChuoi);

  return headers.find((header) => {
    const normalizedHeader = chuanHoaChuoi(header);
    return normalizedAliases.some((alias) => normalizedHeader === alias || normalizedHeader.includes(alias));
  });
};

const dinhDangNgay = (year: number, month: number, day: number) =>
  `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const ngayTuExcelSerial = (value: number) => {
  const excelEpoch = Date.UTC(1899, 11, 30);
  const date = new Date(excelEpoch + value * 24 * 60 * 60 * 1000);
  return dinhDangNgay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
};

const layNgayIso = (value: unknown) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return ngayTuExcelSerial(value);
  }

  const raw = String(value).trim();
  const isoWithTime = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T\s]/);

  if (isoWithTime) {
    return dinhDangNgay(Number(isoWithTime[1]), Number(isoWithTime[2]), Number(isoWithTime[3]));
  }

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (iso) {
    return dinhDangNgay(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const vn = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

  if (vn) {
    const namGoc = Number.parseInt(vn[3], 10);
    const nam = vn[3].length === 2 ? 2000 + namGoc : namGoc;
    return dinhDangNgay(nam, Number(vn[2]), Number(vn[1]));
  }

  return null;
};

const layGio = (value: unknown) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const totalMinutes = Math.round(value * 24 * 60);
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
  }

  const raw = String(value).trim();
  const match = raw.match(/(\d{1,2})[:hH](\d{1,2})/);

  if (!match) {
    return null;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const taoNgayGioVietNam = (ngayIso: string, gio: string) => new Date(`${ngayIso}T${gio}:00+07:00`);

const layNgayGioThi = (row: DongImportLichThi, mapping: MappingCotImportLichThi) => {
  const thoiGianThiRaw = mapping.thoiGianThi ? row[mapping.thoiGianThi] : null;
  const ngayTuCotGop = layNgayIso(thoiGianThiRaw);
  const gioTuCotGop = layGio(thoiGianThiRaw);
  const ngayThi = ngayTuCotGop ?? layNgayIso(mapping.ngayThi ? row[mapping.ngayThi] : null);
  const gioBatDau = gioTuCotGop ?? layGio(mapping.gioBatDau ? row[mapping.gioBatDau] : null);

  if (!ngayThi || !gioBatDau) {
    return null;
  }

  const thoiGianThi = taoNgayGioVietNam(ngayThi, gioBatDau);
  return Number.isNaN(thoiGianThi.getTime()) ? null : thoiGianThi;
};

export const goiYMappingCotImportLichThi = (headers: string[]) => {
  const mapping: Partial<MappingCotImportLichThi> = {};

  for (const [key, aliases] of Object.entries(BO_COT_IMPORT)) {
    const header = cotGanDung(headers, aliases);

    if (header) {
      mapping[key as keyof MappingCotImportLichThi] = header;
    }
  }

  return mapping;
};

export const boSungMappingCotImportLichThi = (
  mapping: Partial<MappingCotImportLichThi>,
  headers: string[]
) => {
  const fallback = goiYMappingCotImportLichThi(headers);
  const ketQua: Partial<MappingCotImportLichThi> = { ...fallback };
  const headerSet = new Set(headers);

  for (const [key, value] of Object.entries(mapping)) {
    if (value && headerSet.has(value)) {
      ketQua[key as keyof MappingCotImportLichThi] = value;
    }
  }

  return ketQua;
};

export class DichVuMappingImportLichThi {
  kiemTraMapping(mapping: MappingCotImportLichThi) {
    const errors: string[] = [];

    if (!mapping.maMonHoc && !mapping.maMon && !mapping.tenMon) {
      errors.push("Cần map ít nhất một cột Mã môn hoặc Tên môn học");
    }

    if (!mapping.thoiGianThi && (!mapping.ngayThi || !mapping.gioBatDau)) {
      errors.push("Cần map cột Thời gian thi hoặc cặp cột Ngày thi và Giờ bắt đầu");
    }

    return errors;
  }

  chuanHoaDong(row: DongImportLichThi, mapping: MappingCotImportLichThi, rowIndex: number) {
    const loi: string[] = [];
    const maMonHoc = layText(row, mapping.maMonHoc) || null;
    const maMon = layText(row, mapping.maMon) || null;
    const tenMon = layText(row, mapping.tenMon) || null;
    const thoiGianThi = layNgayGioThi(row, mapping);
    const phongThi = layText(row, mapping.phongThi) || null;
    const diaDiemThi = layText(row, mapping.diaDiemThi) || null;

    if (!maMonHoc && !maMon && !tenMon) {
      loi.push("Thiếu thông tin môn học");
    }

    if (!thoiGianThi) {
      loi.push("Thời gian thi không hợp lệ");
    }

    return {
      rowIndex,
      maMonHoc,
      maMon,
      tenMon,
      thoiGianThi: thoiGianThi ?? undefined,
      phongThi,
      diaDiemThi,
      loi
    } satisfies DongImportLichThiDaChuanHoa;
  }
}
