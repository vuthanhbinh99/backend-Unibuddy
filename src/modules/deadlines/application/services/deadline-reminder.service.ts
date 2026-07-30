const MOT_GIO_MS = 60 * 60 * 1000;

/**
 * Các mốc nhắc mặc định (số giờ trước hạn nộp) khi sinh viên chưa tùy chỉnh
 * trong phần Cài đặt. Theo quy tắc BR-SCH-03: nhắc trước 24h và 3h.
 */
export const CAC_MOC_NHAC_MAC_DINH_GIO = [24, 3] as const;

/**
 * Các mốc nhắc hợp lệ mà sinh viên có thể chọn trong Cài đặt.
 * `0` nghĩa là tắt nhắc nhở deadline.
 */
export const CAC_MOC_NHAC_CHO_PHEP_GIO = [24, 12, 3, 0] as const;

export type MocNhacDeadline = {
  soGioTruocHan: number;
  thoiGianNhac: Date;
};

const locMocHopLe = (hanNop: Date, hienTai: Date) => (moc: MocNhacDeadline) =>
  moc.thoiGianNhac.getTime() > hienTai.getTime() && moc.thoiGianNhac <= hanNop;

/**
 * Tính các mốc nhắc dựa trên danh sách số giờ trước hạn nộp.
 * Chỉ giữ lại các mốc còn nằm trong tương lai và trước thời điểm hạn nộp.
 */
export const tinhCacMocNhacDeadline = (
  hanNop: Date,
  cacSoGioTruocHan: readonly number[],
  hienTai = new Date()
): MocNhacDeadline[] =>
  cacSoGioTruocHan
    .filter((soGio) => Number.isFinite(soGio) && soGio > 0)
    .map((soGioTruocHan) => ({
      soGioTruocHan,
      thoiGianNhac: new Date(hanNop.getTime() - soGioTruocHan * MOT_GIO_MS)
    }))
    .filter(locMocHopLe(hanNop, hienTai));

/**
 * Quy đổi tùy chỉnh nhắc nhở của sinh viên thành danh sách số giờ trước hạn.
 * - `null`/`undefined`: dùng mốc mặc định 24h và 3h.
 * - `0`: tắt nhắc nhở, không tạo mốc nào.
 * - giá trị dương: chỉ tạo đúng một mốc theo lựa chọn.
 */
export const layCacSoGioNhacTheoTuyChinh = (
  soGioTruocHan: number | null | undefined
): number[] => {
  if (soGioTruocHan === null || soGioTruocHan === undefined) {
    return [...CAC_MOC_NHAC_MAC_DINH_GIO];
  }

  if (soGioTruocHan <= 0) {
    return [];
  }

  return [soGioTruocHan];
};

/**
 * Giữ lại để tương thích ngược: tính mốc nhắc mặc định 24h/3h.
 */
export const tinhCacMocNhacDeadlineMacDinh = (hanNop: Date, hienTai = new Date()) =>
  tinhCacMocNhacDeadline(hanNop, CAC_MOC_NHAC_MAC_DINH_GIO, hienTai);
