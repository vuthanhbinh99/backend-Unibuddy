export type TieuChiMatKhau = {
  doDaiToiThieu: boolean;
  coChuHoa: boolean;
  coChuThuong: boolean;
  coChuSo: boolean;
  coKyTuDacBiet: boolean;
  khongChuaThongTinCaNhan: boolean;
  khongPhoBien: boolean;
}

export type KetQuaKiemTraMatKhau = {
  diem: 0 | 1 | 2 | 3 | 4;
  dat: boolean;
  tieuChi: TieuChiMatKhau;
  goiY: string [];
}



export interface BoKiemTraDoMatKhau {
  kiemTra(matKhau: string, thongTinLienQuan?: string[]): Promise<KetQuaKiemTraMatKhau>;
}