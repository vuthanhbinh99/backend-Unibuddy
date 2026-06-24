const MOT_GIO_MS = 60 * 60 * 1000;

const CAC_MOC_NHAC_MAC_DINH_GIO = [24, 3] as const;

export const tinhCacMocNhacDeadlineMacDinh = (hanNop: Date, hienTai = new Date()) =>
  CAC_MOC_NHAC_MAC_DINH_GIO
    .map((soGioTruocHan) => ({
      soGioTruocHan,
      thoiGianNhac: new Date(hanNop.getTime() - soGioTruocHan * MOT_GIO_MS)
    }))
    .filter((item) => item.thoiGianNhac.getTime() > hienTai.getTime() && item.thoiGianNhac <= hanNop);
