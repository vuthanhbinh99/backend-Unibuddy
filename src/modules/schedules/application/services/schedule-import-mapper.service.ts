import type {
  DongImportThoiKhoaBieu,
  DuLieuLichHoc,
  MappingCotImportThoiKhoaBieu
} from "../../domain/schedule.js";

export type DongImportDaChuanHoa = Partial<DuLieuLichHoc> & {
  rowIndex: number;
  maMon: string | null;
  tenMon: string | null;
  soTinChi: number | null;
  loi: string[];
};

const BO_COT_IMPORT = {
  maMonHoc: ["ma mon hoc", "ma_mon_hoc", "ma hoc phan uuid", "ma hp uuid"],
  maMon: ["ma mon", "ma_mon", "ma hoc phan", "ma hp", "code"],
  tenMon: ["ten mon", "ten_mon", "mon hoc", "hoc phan", "ten hoc phan"],
  thu: ["thu", "thu trong tuan", "ngay hoc"],
  tietBatDau: ["tiet bat dau", "tiet_bd", "tiet bd", "tiet", "ca hoc"],
  soTiet: ["so tiet", "so_tiet", "tong tiet", "thoi luong"],
  soTinChi: ["so tin chi", "so_tin_chi", "tin chi", "stc"],
  phongHoc: ["phong", "phong hoc", "dia diem"],
  ngayBatDau: ["ngay bat dau", "tu ngay", "bat dau"],
  ngayKetThuc: ["ngay ket thuc", "den ngay", "ket thuc"]
} satisfies Record<keyof MappingCotImportThoiKhoaBieu, string[]>;

const chuanHoaChuoi = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const layText = (row: DongImportThoiKhoaBieu, column?: string) => {
  if (!column) {
    return "";
  }

  const value = row[column];
  return value === null || value === undefined ? "" : String(value).trim();
};

const laySoNguyen = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  const raw = String(value ?? "").trim();
  const match = raw.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : null;
};

const layThu = (value: unknown) => {
  const text = chuanHoaChuoi(value);
  const numeric = laySoNguyen(value);

  if (numeric && numeric >= 2 && numeric <= 8) {
    return numeric;
  }

  if (["cn", "chu nhat", "sunday", "sun"].includes(text)) {
    return 8;
  }

  const bangChu: Record<string, number> = {
    hai: 2,
    ba: 3,
    tu: 4,
    nam: 5,
    sau: 6,
    bay: 7
  };

  for (const [key, thu] of Object.entries(bangChu)) {
    if (text.includes(key)) {
      return thu;
    }
  }

  return null;
};

const layKhoangTiet = (tietBatDauRaw: unknown, soTietRaw: unknown) => {
  const tietText = String(tietBatDauRaw ?? "").trim();
  const range = tietText.match(/(\d+)\s*[-–]\s*(\d+)/);

  if (range) {
    const start = Number.parseInt(range[1], 10);
    const end = Number.parseInt(range[2], 10);

    if (end >= start) {
      return { tietBatDau: start, soTiet: end - start + 1 };
    }
  }

  return {
    tietBatDau: laySoNguyen(tietBatDauRaw),
    soTiet: laySoNguyen(soTietRaw)
  };
};

const dinhDangNgayIso = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const layNgay = (value: unknown) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return dinhDangNgayIso(new Date(excelEpoch + value * 24 * 60 * 60 * 1000));
  }

  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }

  const vn = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (vn) {
    return `${vn[3]}-${vn[2].padStart(2, "0")}-${vn[1].padStart(2, "0")}`;
  }

  return null;
};

const cotGanDung = (headers: string[], aliases: string[]) => {
  const normalizedAliases = aliases.map(chuanHoaChuoi);

  return headers.find((header) => {
    const normalizedHeader = chuanHoaChuoi(header);
    return normalizedAliases.some((alias) => normalizedHeader === alias || normalizedHeader.includes(alias));
  });
};

export const goiYMappingCotImportThoiKhoaBieu = (headers: string[]) => {
  const mapping: Partial<MappingCotImportThoiKhoaBieu> = {};

  for (const [key, aliases] of Object.entries(BO_COT_IMPORT)) {
    const header = cotGanDung(headers, aliases);

    if (header) {
      mapping[key as keyof MappingCotImportThoiKhoaBieu] = header;
    }
  }

  return mapping;
};

export class DichVuMappingImportThoiKhoaBieu {
  kiemTraMapping(mapping: MappingCotImportThoiKhoaBieu) {
    const errors: string[] = [];

    if (!mapping.maMonHoc && !mapping.maMon && !mapping.tenMon) {
      errors.push("Cần map ít nhất một cột Mã môn học, Mã môn hoặc Tên môn");
    }

    if (!mapping.thu) {
      errors.push("Cần map cột Thứ");
    }

    if (!mapping.tietBatDau) {
      errors.push("Cần map cột Tiết bắt đầu hoặc khoảng tiết");
    }

    return errors;
  }

  chuanHoaDong(row: DongImportThoiKhoaBieu, mapping: MappingCotImportThoiKhoaBieu, rowIndex: number) {
    const loi: string[] = [];
    const maMonHoc = layText(row, mapping.maMonHoc) || undefined;
    const maMon = layText(row, mapping.maMon) || null;
    const tenMon = layText(row, mapping.tenMon) || null;
    const soTinChi = mapping.soTinChi ? laySoNguyen(row[mapping.soTinChi]) : null;
    const thu = mapping.thu ? layThu(row[mapping.thu]) : null;
    const { tietBatDau, soTiet } = mapping.tietBatDau
      ? layKhoangTiet(row[mapping.tietBatDau], mapping.soTiet ? row[mapping.soTiet] : null)
      : { tietBatDau: null, soTiet: null };
    const phongHoc = layText(row, mapping.phongHoc) || null;
    const ngayBatDau = layNgay(mapping.ngayBatDau ? row[mapping.ngayBatDau] : null);
    const ngayKetThuc = layNgay(mapping.ngayKetThuc ? row[mapping.ngayKetThuc] : null);

    if (!maMonHoc && !maMon && !tenMon) {
      loi.push("Thiếu thông tin môn học");
    }

    if (!thu || thu < 2 || thu > 8) {
      loi.push("Thứ không hợp lệ, chỉ nhận giá trị từ 2 đến 8");
    }

    if (!tietBatDau || tietBatDau < 1 || tietBatDau > 12) {
      loi.push("Tiết bắt đầu không hợp lệ, chỉ nhận giá trị từ 1 đến 12");
    }

    if (!soTiet || soTiet < 1) {
      loi.push("Số tiết phải lớn hơn 0");
    }

    if (mapping.soTinChi && (!soTinChi || soTinChi < 1)) {
      loi.push("Số tín chỉ phải lớn hơn 0");
    }

    if (tietBatDau && soTiet && tietBatDau + soTiet - 1 > 12) {
      loi.push("Khoảng tiết học vượt quá tiết 12");
    }

    if (mapping.ngayBatDau && row[mapping.ngayBatDau] && !ngayBatDau) {
      loi.push("Ngày bắt đầu không hợp lệ");
    }

    if (mapping.ngayKetThuc && row[mapping.ngayKetThuc] && !ngayKetThuc) {
      loi.push("Ngày kết thúc không hợp lệ");
    }

    if (ngayBatDau && ngayKetThuc && ngayBatDau > ngayKetThuc) {
      loi.push("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
    }

    return {
      rowIndex,
      maMonHoc,
      maMon,
      tenMon,
      soTinChi,
      thu: thu ?? undefined,
      tietBatDau: tietBatDau ?? undefined,
      soTiet: soTiet ?? undefined,
      phongHoc,
      ngayBatDau,
      ngayKetThuc,
      loi
    } satisfies DongImportDaChuanHoa;
  }
}
