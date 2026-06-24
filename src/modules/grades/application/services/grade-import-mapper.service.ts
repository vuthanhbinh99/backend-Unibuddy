import type {
  DongImportDiemSo,
  MappingCotImportDiemSo
} from "../../domain/grade.js";

export type DongImportDiemDaChuanHoa = {
  rowIndex: number;
  maMonHoc: string | null;
  maMon: string | null;
  tenMon: string | null;
  soTinChi: number | null;
  tenThanhPhan: string | null;
  trongSo: number | null;
  diem: number | null;
  loi: string[];
};

const BO_COT_IMPORT = {
  maMonHoc: ["ma mon hoc", "ma_mon_hoc", "ma hoc phan uuid", "ma hp uuid"],
  maMon: ["ma mon", "ma_mon", "ma hoc phan", "ma hp", "ma mh", "code", "subject code"],
  tenMon: ["ten mon", "ten_mon", "ten hoc phan", "hoc phan", "mon hoc", "subject"],
  soTinChi: ["so tin chi", "so_tin_chi", "tin chi", "stc", "credits"],
  tenThanhPhan: ["ten thanh phan", "cot diem", "dau diem", "loai diem", "component"],
  trongSo: ["trong so", "ty le", "ti le", "%", "weight"],
  diem: ["diem", "diem so", "diem thanh phan", "score", "mark"],
  diemTongKet: ["diem tong ket", "tong ket", "diem tk", "tk", "diem he 10", "he 10", "final"]
} satisfies Record<keyof MappingCotImportDiemSo, string[]>;

const TEN_THANH_PHAN_TONG_KET = "Tổng kết";

export const chuanHoaChuoiImportDiem = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();

const layText = (row: DongImportDiemSo, column?: string) => {
  if (!column) {
    return "";
  }

  const value = row[column];
  return value === null || value === undefined ? "" : String(value).trim();
};

const laySo = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const raw = String(value ?? "")
    .trim()
    .replace(",", ".");
  const match = raw.match(/-?\d+(?:\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : null;
};

const laySoTinChi = (value: unknown) => {
  const parsed = laySo(value);
  return parsed && parsed > 0 ? Math.trunc(parsed) : null;
};

const cotGanDung = (headers: string[], aliases: string[]) => {
  const normalizedAliases = aliases.map(chuanHoaChuoiImportDiem);

  return headers.find((header) => {
    const normalizedHeader = chuanHoaChuoiImportDiem(header);
    return normalizedAliases.some((alias) => normalizedHeader === alias || normalizedHeader.includes(alias));
  });
};

export const goiYMappingCotImportDiemSo = (headers: string[]) => {
  const mapping: Partial<MappingCotImportDiemSo> = {};

  for (const [key, aliases] of Object.entries(BO_COT_IMPORT)) {
    const header = cotGanDung(headers, aliases);

    if (header) {
      mapping[key as keyof MappingCotImportDiemSo] = header;
    }
  }

  return mapping;
};

export class DichVuMappingImportDiemSo {
  kiemTraMapping(mapping: MappingCotImportDiemSo) {
    const errors: string[] = [];

    if (!mapping.maMonHoc && !mapping.maMon && !mapping.tenMon) {
      errors.push("Cần map ít nhất một cột Mã môn học, Mã môn hoặc Tên môn");
    }

    if (!mapping.diem && !mapping.diemTongKet) {
      errors.push("Cần map cột Điểm thành phần hoặc Điểm tổng kết");
    }

    return errors;
  }

  chuanHoaDong(row: DongImportDiemSo, mapping: MappingCotImportDiemSo, rowIndex: number): DongImportDiemDaChuanHoa {
    const loi: string[] = [];
    const maMonHoc = layText(row, mapping.maMonHoc) || null;
    const maMon = layText(row, mapping.maMon) || null;
    const tenMon = layText(row, mapping.tenMon) || null;
    const soTinChi = mapping.soTinChi ? laySoTinChi(row[mapping.soTinChi]) : null;
    const diemThanhPhan = mapping.diem ? laySo(row[mapping.diem]) : null;
    const diemTongKet = mapping.diemTongKet ? laySo(row[mapping.diemTongKet]) : null;
    const tenThanhPhanRaw = layText(row, mapping.tenThanhPhan);
    const tenThanhPhan = tenThanhPhanRaw || (diemTongKet !== null ? TEN_THANH_PHAN_TONG_KET : null);
    const trongSo = mapping.trongSo ? laySo(row[mapping.trongSo]) : diemTongKet !== null ? 100 : null;
    const diem = diemThanhPhan ?? diemTongKet;

    if (!maMonHoc && !maMon && !tenMon) {
      loi.push("Thiếu thông tin môn học");
    }

    if (!tenThanhPhan) {
      loi.push("Thiếu tên thành phần điểm");
    }

    if (trongSo === null || !Number.isFinite(trongSo) || trongSo <= 0 || trongSo > 100) {
      loi.push("Trọng số phải lớn hơn 0 và không vượt quá 100");
    }

    if (diem === null || !Number.isFinite(diem) || diem < 0 || diem > 10) {
      loi.push("Điểm số phải nằm trong khoảng 0 đến 10");
    }

    if (mapping.soTinChi && !soTinChi) {
      loi.push("Số tín chỉ phải lớn hơn 0");
    }

    return {
      rowIndex,
      maMonHoc,
      maMon,
      tenMon,
      soTinChi,
      tenThanhPhan,
      trongSo,
      diem,
      loi
    };
  }
}

