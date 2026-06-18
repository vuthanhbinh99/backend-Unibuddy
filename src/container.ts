import { BoMaHoaMatKhauBcrypt } from "./modules/auth/infrastructure/bcrypt-password-hasher.js";
import { BoKiemTraDanhTinhGoogleQuaAPI } from "./modules/auth/infrastructure/google-token-info.verifier.js";
import { DichVuTokenJwt } from "./modules/auth/infrastructure/jwt-token.service.js";
import { KhoPhienDangNhapPostgres } from "./modules/auth/infrastructure/postgres-session.repository.js";
import { XuLyDangNhapGoogle } from "./modules/auth/application/use-cases/google-login.use-case.js";
import { XuLyDangNhap } from "./modules/auth/application/use-cases/login.use-case.js";
import { XuLyDangXuat } from "./modules/auth/application/use-cases/logout.use-case.js";
import { XuLyLamMoiToken } from "./modules/auth/application/use-cases/refresh-token.use-case.js";
import { KhoNhatKyHeThongPostgres } from "./modules/audit-logs/infrastructure/postgres-audit-log.repository.js";
import { XuLyLayNguoiDungHienTai } from "./modules/users/application/use-cases/get-current-user.use-case.js";
import { KhoNguoiDungPostgres } from "./modules/users/infrastructure/postgres-user.repository.js";
import { KhoTruongHocPostgres } from "./modules/schools/infrastructure/postgres-school.repository.js";
import { XuLyDanhSachTruongHoc } from "./modules/schools/application/use-cases/list-schools.use-case.js";
import { XuLyLayChiTietTruongHoc } from "./modules/schools/application/use-cases/get-school.use-case.js";
import { XuLyTaoTruongHoc } from "./modules/schools/application/use-cases/create-school.use-case.js";
import { XuLyCapNhatTruongHoc } from "./modules/schools/application/use-cases/update-school.use-case.js";
import { XuLyXoaTruongHoc } from "./modules/schools/application/use-cases/delete-school.use-case.js";
import { KhoHocThuatTruongHocPostgres } from "./modules/academic-rules/infrastructure/postgres-academic-rules.repository.js";
import { XuLyLayCauHinhHocThuatTruongHoc } from "./modules/academic-rules/application/use-cases/get-academic-rules.use-case.js";
import { XuLyCapNhatThangDiemTruongHoc } from "./modules/academic-rules/application/use-cases/update-score-scale.use-case.js";
import { XuLyCapNhatQuyCheHocLucTruongHoc } from "./modules/academic-rules/application/use-cases/update-academic-standing.use-case.js";
import { KhoBaoCaoTaiLieuPostgres } from "./modules/report-document/infranstructure/postgres-report-document.repository.js";
import { XuLyDanhSachBaoCaoTaiLieu } from "./modules/report-document/application/use-cases/list-report-documents.use-case.js";
import { XuLyLayChiTietBaoCaoTaiLieu } from "./modules/report-document/application/use-cases/get-report-document.use-case.js";
import { XuLyDuyetBaoCaoTaiLieu } from "./modules/report-document/application/use-cases/approve-report-document.use-case.js";
import { XuLyTuChoiBaoCaoTaiLieu } from "./modules/report-document/application/use-cases/reject-report-document.use-case.js";
import { DichVuGuiEmailSmtp } from "./shared/email/smtp-email.provider.js";
import { cauHinh } from "./shared/config/env.js";
import { KetNoiPostgres } from "./shared/database/postgres.js";
import { BoQuanLyGiaoDichPostgres } from "./shared/database/transaction.js";

let boPhuThuoc: BoPhuThuocUngDung | null = null;

export type BoPhuThuocUngDung = ReturnType<typeof taoBoPhuThuoc>;

const taoBoPhuThuoc = () => {
  const coSoDuLieu = new KetNoiPostgres();
  const giaoDich = new BoQuanLyGiaoDichPostgres(coSoDuLieu);

  const khoNguoiDung = new KhoNguoiDungPostgres(coSoDuLieu);
  const khoPhienDangNhap = new KhoPhienDangNhapPostgres(coSoDuLieu);
  const khoNhatKyHeThong = new KhoNhatKyHeThongPostgres(coSoDuLieu);
  const khoTruongHoc = new KhoTruongHocPostgres(coSoDuLieu);
  const khoHocThuatTruongHoc = new KhoHocThuatTruongHocPostgres(coSoDuLieu);
  const khoBaoCaoTaiLieu = new KhoBaoCaoTaiLieuPostgres(coSoDuLieu);

  const boMaHoaMatKhau = new BoMaHoaMatKhauBcrypt();
  const dichVuToken = new DichVuTokenJwt();
  const dichVuGuiEmail = new DichVuGuiEmailSmtp(cauHinh.email.smtp);
  const boKiemTraDanhTinhGoogle = new BoKiemTraDanhTinhGoogleQuaAPI(cauHinh.auth.googleClientIds);

  const xuLyDangNhap = new XuLyDangNhap({
    khoNguoiDung,
    khoPhienDangNhap,
    khoNhatKyHeThong,
    boMaHoaMatKhau,
    dichVuToken,
    giaoDich
  });

  const xuLyDangNhapGoogle = new XuLyDangNhapGoogle({
    khoNguoiDung,
    khoPhienDangNhap,
    khoNhatKyHeThong,
    boMaHoaMatKhau,
    dichVuToken,
    giaoDich,
    boKiemTraDanhTinhGoogle,
    maCodeVaiTroSinhVienMacDinh: cauHinh.auth.maCodeVaiTroSinhVienMacDinh
  });

  const xuLyLamMoiToken = new XuLyLamMoiToken({
    khoNguoiDung,
    khoPhienDangNhap,
    khoNhatKyHeThong,
    dichVuToken,
    giaoDich
  });

  const xuLyDangXuat = new XuLyDangXuat({
    khoPhienDangNhap,
    khoNhatKyHeThong,
    dichVuToken,
    giaoDich
  });

  const xuLyLayNguoiDungHienTai = new XuLyLayNguoiDungHienTai({ khoNguoiDung });
  const xuLyDanhSachTruongHoc = new XuLyDanhSachTruongHoc({ khoTruongHoc });
  const xuLyLayChiTietTruongHoc = new XuLyLayChiTietTruongHoc({ khoTruongHoc });
  const xuLyTaoTruongHoc = new XuLyTaoTruongHoc({
    khoTruongHoc,
    khoNhatKyHeThong,
    giaoDich
  });
  const xuLyCapNhatTruongHoc = new XuLyCapNhatTruongHoc({
    khoTruongHoc,
    khoNhatKyHeThong,
    giaoDich
  });
  const xuLyXoaTruongHoc = new XuLyXoaTruongHoc({
    khoTruongHoc,
    khoNhatKyHeThong,
    giaoDich
  });

  const xuLyLayCauHinhHocThuatTruongHoc = new XuLyLayCauHinhHocThuatTruongHoc({
    khoTruongHoc,
    khoHocThuatTruongHoc
  });

  const xuLyCapNhatThangDiemTruongHoc = new XuLyCapNhatThangDiemTruongHoc({
    khoTruongHoc,
    khoHocThuatTruongHoc,
    khoNhatKyHeThong,
    giaoDich
  });

  const xuLyCapNhatQuyCheHocLucTruongHoc = new XuLyCapNhatQuyCheHocLucTruongHoc({
    khoTruongHoc,
    khoHocThuatTruongHoc,
    khoNhatKyHeThong,
    giaoDich
  });

  const xuLyDanhSachBaoCaoTaiLieu = new XuLyDanhSachBaoCaoTaiLieu({ khoBaoCaoTaiLieu });
  const xuLyLayChiTietBaoCaoTaiLieu = new XuLyLayChiTietBaoCaoTaiLieu({ khoBaoCaoTaiLieu });
  const xuLyDuyetBaoCaoTaiLieu = new XuLyDuyetBaoCaoTaiLieu({
    khoBaoCaoTaiLieu,
    khoNhatKyHeThong,
    giaoDich,
    dichVuGuiEmail
  });
  const xuLyTuChoiBaoCaoTaiLieu = new XuLyTuChoiBaoCaoTaiLieu({
    khoBaoCaoTaiLieu,
    khoNhatKyHeThong,
    giaoDich,
    dichVuGuiEmail
  });

  return {
    coSoDuLieu,
    giaoDich,
    khoNguoiDung,
    khoPhienDangNhap,
    khoNhatKyHeThong,
    khoTruongHoc,
    khoHocThuatTruongHoc,
    khoBaoCaoTaiLieu,
    boMaHoaMatKhau,
    dichVuToken,
    dichVuGuiEmail,
    boKiemTraDanhTinhGoogle,
    xuLyDangNhap,
    xuLyDangNhapGoogle,
    xuLyLamMoiToken,
    xuLyDangXuat,
    xuLyLayNguoiDungHienTai,
    xuLyDanhSachTruongHoc,
    xuLyLayChiTietTruongHoc,
    xuLyTaoTruongHoc,
    xuLyCapNhatTruongHoc,
    xuLyXoaTruongHoc,
    xuLyLayCauHinhHocThuatTruongHoc,
    xuLyCapNhatThangDiemTruongHoc,
    xuLyCapNhatQuyCheHocLucTruongHoc,
    xuLyDanhSachBaoCaoTaiLieu,
    xuLyLayChiTietBaoCaoTaiLieu,
    xuLyDuyetBaoCaoTaiLieu,
    xuLyTuChoiBaoCaoTaiLieu
  };
};

export const xayDungBoPhuThuoc = () => {
  boPhuThuoc ??= taoBoPhuThuoc();
  return boPhuThuoc;
};



