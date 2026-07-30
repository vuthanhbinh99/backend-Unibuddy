export type MucThangDiemNhap = {
  diemTu: number;
  diemDen: number;
  diemChu: string;
  he4: number;
};

export type MucThangDiem = MucThangDiemNhap;

export type QuyCheHocLucNhap = {
  xepLoai: string;
  gpaTu: number;
  gpaDen: number;
};

export type QuyCheHocLuc = QuyCheHocLucNhap;

export type CauHinhHocThuatTruongHoc = {
  maTruongCode: string;
  tenThangDiem: string | null;
  mucThangDiem: MucThangDiem[];
  quyCheHocLuc: QuyCheHocLuc[];
};
