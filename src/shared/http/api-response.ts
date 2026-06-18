export type PhanHoiDuLieu<T> = {
  success: true;
  data: T;
};

export type PhanHoiLoi = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export const thanhCong = <T>(data: T): PhanHoiDuLieu<T> => ({
  success: true,
  data
});

export const daTao = <T>(data: T): PhanHoiDuLieu<T> => ({
  success: true,
  data
});



