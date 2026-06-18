export type MucThangDiemNhap = {
  thuTu: number;
  diemTu: number;
  diemDen: number;
  diemChu: string;
  he4: number;
};

export type MucThangDiem = MucThangDiemNhap & {
  maThangDiem: string;
  maTruongCode: string;
  createdAt: Date;
  updatedAt: Date;
};

export type QuyCheHocLucNhap = {
  thuTu: number;
  xepLoai: string;
  gpaTu: number;
  gpaDen: number;
};

export type QuyCheHocLuc = QuyCheHocLucNhap & {
  maQuyCheHocLuc: string;
  maTruongCode: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CauHinhHocThuatTruongHoc = {
  maTruongCode: string;
  mucThangDiem: MucThangDiem[];
  quyCheHocLuc: QuyCheHocLuc[];
};
