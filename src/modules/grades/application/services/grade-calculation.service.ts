import type {
  KetQuaTinhMonHoc,
  MonHocBangDiem,
  MonHocDiemSo,
  MucQuyCheHocLuc,
  MucQuyDoiDiem,
  ThanhPhanDiem,
  TongKetBangDiem
} from "../../domain/grade.js";

const lamTron = (value: number, digits = 2) => Number(value.toFixed(digits));

export const quyDoiDiemHe10 = (diemTongKet: number, thangDiem: MucQuyDoiDiem[]) => {
  const muc = thangDiem.find((item) => diemTongKet >= item.diemTu && diemTongKet <= item.diemDen);

  return muc
    ? {
        diemChu: muc.diemChu,
        diemHe4: muc.he4
      }
    : {
        diemChu: null,
        diemHe4: null
      };
};

export const tinhKetQuaMonHoc = (thanhPhan: ThanhPhanDiem[], thangDiem: MucQuyDoiDiem[]): KetQuaTinhMonHoc => {
  const tongTrongSo = lamTron(thanhPhan.reduce((tong, item) => tong + item.trongSo, 0));
  const duTrongSo = Math.abs(tongTrongSo - 100) < 0.01;
  const dayDuDiem = thanhPhan.length > 0 && thanhPhan.every((item) => item.diem !== null);

  if (!duTrongSo || thanhPhan.length === 0) {
    return {
      tongTrongSo,
      duTrongSo,
      dayDuDiem,
      diemTongKetHe10: null,
      diemChu: null,
      diemHe4: null
    };
  }

  const diemTongKetHe10 = lamTron(
    thanhPhan.reduce((tong, item) => tong + (item.diem ?? 0) * (item.trongSo / 100), 0)
  );
  const quyDoi = dayDuDiem ? quyDoiDiemHe10(diemTongKetHe10, thangDiem) : { diemChu: null, diemHe4: null };

  return {
    tongTrongSo,
    duTrongSo,
    dayDuDiem,
    diemTongKetHe10,
    ...quyDoi
  };
};

export const lapBangDiemMonHoc = (
  monHoc: MonHocDiemSo[],
  thanhPhanTheoMon: Map<string, ThanhPhanDiem[]>,
  thangDiem: MucQuyDoiDiem[]
): MonHocBangDiem[] =>
  monHoc.map((item) => {
    const thanhPhan = thanhPhanTheoMon.get(item.maMonHoc) ?? [];

    return {
      ...item,
      thanhPhan,
      ketQua: tinhKetQuaMonHoc(thanhPhan, thangDiem)
    };
  });

export const tinhTongKetBangDiem = (items: MonHocBangDiem[], quyCheHocLuc: MucQuyCheHocLuc[]): TongKetBangDiem => {
  const monDaTinh = items.filter((item) => item.ketQua.diemHe4 !== null && item.ketQua.dayDuDiem);
  const soTinChiDaTinh = monDaTinh.reduce((tong, item) => tong + item.soTinChi, 0);
  const soTinChiConLai = items
    .filter((item) => item.ketQua.diemHe4 === null || !item.ketQua.dayDuDiem)
    .reduce((tong, item) => tong + item.soTinChi, 0);
  const tongDiemHe4 = monDaTinh.reduce((tong, item) => tong + (item.ketQua.diemHe4 ?? 0) * item.soTinChi, 0);
  const gpa = soTinChiDaTinh > 0 ? lamTron(tongDiemHe4 / soTinChiDaTinh) : null;
  const xepLoai = gpa === null ? null : quyCheHocLuc.find((item) => gpa >= item.gpaTu && gpa <= item.gpaDen)?.xepLoai ?? null;

  return {
    soTinChiDaTinh,
    soTinChiConLai,
    gpaHocKy: gpa,
    gpaTichLuy: gpa,
    xepLoaiHocLuc: xepLoai
  };
};

export const timDiemHe10ToiThieuChoHe4 = (he4MucTieu: number, thangDiem: MucQuyDoiDiem[]) => {
  const mucPhuHop = thangDiem
    .filter((item) => item.he4 >= he4MucTieu)
    .sort((a, b) => a.diemTu - b.diemTu)[0];

  return mucPhuHop ? lamTron(mucPhuHop.diemTu) : null;
};

