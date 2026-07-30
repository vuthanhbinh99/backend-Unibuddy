import { LoiUngDung } from "../../../shared/errors/app-error.js";
import type { MucThangDiemNhap, QuyCheHocLucNhap } from "../domain/academic-rules.js";

export const xacThucDanhSachThangDiem = (mucThangDiem: MucThangDiemNhap[]) => {
  if (mucThangDiem.length === 0) {
    throw LoiUngDung.yeuCauSai("Danh sách thang điểm không được để trống");
  }

  const daSapXep = [...mucThangDiem].sort((a, b) => a.diemTu - b.diemTu);

  daSapXep.forEach((muc, index) => {
    if (muc.diemTu > muc.diemDen) {
      throw LoiUngDung.yeuCauSai("Khoảng điểm không hợp lệ");
    }

    if (index > 0) {
      const mucTruocDo = daSapXep[index - 1];
      if (muc.diemTu <= mucTruocDo.diemDen) {
        throw LoiUngDung.xungDot("Các khoảng điểm không được chồng chéo");
      }
    }
  });

  return daSapXep;
};

export const xacThucDanhSachQuyCheHocLuc = (quyCheHocLuc: QuyCheHocLucNhap[]) => {
  if (quyCheHocLuc.length === 0) {
    throw LoiUngDung.yeuCauSai("Danh sách quy chế học lực không được để trống");
  }

  const daSapXep = [...quyCheHocLuc].sort((a, b) => a.gpaTu - b.gpaTu);

  daSapXep.forEach((muc, index) => {
    if (muc.gpaTu > muc.gpaDen) {
      throw LoiUngDung.yeuCauSai("Khoảng GPA không hợp lệ");
    }

    if (index > 0) {
      const mucTruocDo = daSapXep[index - 1];
      if (muc.gpaTu <= mucTruocDo.gpaDen) {
        throw LoiUngDung.xungDot("Các khoảng GPA không được chồng chéo");
      }
    }
  });

  return daSapXep;
};
