import type {
  BoKiemTraDoMatKhau,
  KetQuaKiemTraMatKhau,
  TieuChiMatKhau
} from "../application/ports/password-strength-checker.js";

const DANH_SACH_MAT_KHAU_PHO_BIEN = new Set([
  "12345678", "password", "123456789", "11111111", "qwertyui"
]);

export class BoKiemTraDoMatKhauTheoQuyTac implements BoKiemTraDoMatKhau {
  async kiemTra(matKhau: string, thongTinLienQuan: string[] = []): Promise<KetQuaKiemTraMatKhau> {
    const tieuChi: TieuChiMatKhau = {
      doDaiToiThieu: matKhau.length >= 8,
      coChuHoa: /[A-Z]/.test(matKhau),
      coChuThuong: /[a-z]/.test(matKhau),
      coChuSo: /\d/.test(matKhau),
      coKyTuDacBiet: /[^A-Za-z0-9]/.test(matKhau),
      khongChuaThongTinCaNhan: !thongTinLienQuan.some(
        (tt) => tt && tt.length >= 3 && matKhau.toLowerCase().includes(tt.toLowerCase())
      ),
      khongPhoBien: !DANH_SACH_MAT_KHAU_PHO_BIEN.has(matKhau.toLowerCase())
    };

    const soTieuChiDat = Object.values(tieuChi).filter(Boolean).length;
    const diem = Math.min(4, Math.max(0, soTieuChiDat - 3)) as KetQuaKiemTraMatKhau["diem"];

    const goiY: string[] = [];
    if (!tieuChi.doDaiToiThieu) goiY.push("Dùng ít nhất 8 ký tự");
    if (!tieuChi.coChuHoa) goiY.push("Thêm chữ in hoa");
    if (!tieuChi.coChuThuong) goiY.push("Thêm chữ thường");
    if (!tieuChi.coChuSo) goiY.push("Thêm chữ số");
    if (!tieuChi.coKyTuDacBiet) goiY.push("Thêm ký tự đặc biệt");
    if (!tieuChi.khongChuaThongTinCaNhan) goiY.push("Không dùng email/tên/mã sinh viên trong mật khẩu");
    if (!tieuChi.khongPhoBien) goiY.push("Mật khẩu này quá phổ biến, hãy chọn mật khẩu khác");

    const dat =
      tieuChi.doDaiToiThieu && tieuChi.coChuHoa && tieuChi.coChuThuong &&
      tieuChi.coChuSo && tieuChi.khongChuaThongTinCaNhan && tieuChi.khongPhoBien;

    return { diem, dat, tieuChi, goiY };
  }
}