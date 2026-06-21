import type { DuLieuLichHoc } from "../../domain/schedule.js";

type LichHocCoDong = DuLieuLichHoc & {
  rowIndex?: number;
};

const ngayBatDau = (value: string | null) => value ?? "0000-01-01";
const ngayKetThuc = (value: string | null) => value ?? "9999-12-31";

export const kiemTraHaiLichHocTrungNhau = (a: DuLieuLichHoc, b: DuLieuLichHoc) => {
  if (a.thu !== b.thu) {
    return false;
  }

  const aTietKetThuc = a.tietBatDau + a.soTiet - 1;
  const bTietKetThuc = b.tietBatDau + b.soTiet - 1;
  const trungTiet = a.tietBatDau <= bTietKetThuc && b.tietBatDau <= aTietKetThuc;

  if (!trungTiet) {
    return false;
  }

  return ngayBatDau(a.ngayBatDau) <= ngayKetThuc(b.ngayKetThuc) && ngayBatDau(b.ngayBatDau) <= ngayKetThuc(a.ngayKetThuc);
};

export const timXungDotTrongLo = (items: LichHocCoDong[]) => {
  const result = new Map<number, number[]>();

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (!kiemTraHaiLichHocTrungNhau(items[i], items[j])) {
        continue;
      }

      const rowA = items[i].rowIndex ?? i + 1;
      const rowB = items[j].rowIndex ?? j + 1;
      result.set(rowA, [...(result.get(rowA) ?? []), rowB]);
      result.set(rowB, [...(result.get(rowB) ?? []), rowA]);
    }
  }

  return result;
};

export const kiemTraDuLieuLichHocHopLe = (data: DuLieuLichHoc) => {
  const errors: string[] = [];

  if (data.thu < 2 || data.thu > 8) {
    errors.push("Thứ chỉ nhận giá trị từ 2 đến 8");
  }

  if (data.tietBatDau < 1 || data.tietBatDau > 12) {
    errors.push("Tiết bắt đầu chỉ nhận giá trị từ 1 đến 12");
  }

  if (data.soTiet < 1) {
    errors.push("Số tiết phải lớn hơn 0");
  }

  if (data.tietBatDau + data.soTiet - 1 > 12) {
    errors.push("Khoảng tiết học vượt quá tiết 12");
  }

  if (data.ngayBatDau && data.ngayKetThuc && data.ngayBatDau > data.ngayKetThuc) {
    errors.push("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
  }

  return errors;
};
