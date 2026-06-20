import { BoMaHoaMatKhauBcrypt } from "./modules/auth/infrastructure/bcrypt-password-hasher.js";
import { BoKiemTraDanhTinhGoogleQuaAPI } from "./modules/auth/infrastructure/google-token-info.verifier.js";
import { DichVuTokenJwt } from "./modules/auth/infrastructure/jwt-token.service.js";
import { KhoPhienDangNhapPostgres } from "./modules/auth/infrastructure/postgres-session.repository.js";
import { KhoTamDatLaiMatKhauTrongBoNho } from "./modules/auth/infrastructure/in-memory-forgot-password-cache.js";
import { XuLyDangNhapGoogle } from "./modules/auth/application/use-cases/google-login.use-case.js";
import { XuLyDangNhap } from "./modules/auth/application/use-cases/login.use-case.js";
import { XuLyDangXuat } from "./modules/auth/application/use-cases/logout.use-case.js";
import { XuLyLamMoiToken } from "./modules/auth/application/use-cases/refresh-token.use-case.js";
import { XuLyDatLaiMatKhau } from "./modules/auth/application/use-cases/reset-forgot-password.use-case.js";
import { XuLyYeuCauQuenMatKhau } from "./modules/auth/application/use-cases/request-forgot-password.use-case.js";
import { XuLyXacThucMaQuenMatKhau } from "./modules/auth/application/use-cases/verify-forgot-password-code.use-case.js";
import { KhoNhatKyHeThongPostgres } from "./modules/audit-logs/infrastructure/postgres-audit-log.repository.js";
import { XuLyLayNguoiDungHienTai } from "./modules/users/application/use-cases/get-current-user.use-case.js";
import { XuLyDanhSachNguoiDung } from "./modules/users/application/use-cases/list-users.use-case.js";
import { XuLyLayChiTietNguoiDung } from "./modules/users/application/use-cases/get-user-detail.use-case.js";
import { XuLyTaoTaiKhoanQuanTri } from "./modules/users/application/use-cases/create-admin-account.use-case.js";
import { XuLyCapNhatVaiTroNguoiDung } from "./modules/users/application/use-cases/update-user-role.use-case.js";
import { XuLyCapNhatTrangThaiNguoiDung } from "./modules/users/application/use-cases/update-user-status.use-case.js";
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
import { XuLyUploadChiaSeTaiLieu } from "./modules/documents/application/use-cases/upload-shared-document.use-case.js";
import { KhoTaiLieuPostgres } from "./modules/documents/infrastructure/postgres-document.repository.js";
import { DichVuQuyenGhiChu } from "./modules/notes/application/services/note-access.service.js";
import { DichVuTepDinhKemGhiChu } from "./modules/notes/application/services/note-attachment.service.js";
import { DichVuGhiLogLoiGhiChu } from "./modules/notes/application/services/note-error-logger.service.js";
import { XuLyDinhKemTaiLieuGhiChu } from "./modules/notes/application/use-cases/attach-note-document.use-case.js";
import { XuLyTaoGhiChu } from "./modules/notes/application/use-cases/create-note.use-case.js";
import { XuLyXoaGhiChu } from "./modules/notes/application/use-cases/delete-note.use-case.js";
import { XuLyLayChiTietGhiChu } from "./modules/notes/application/use-cases/get-note-detail.use-case.js";
import { XuLyDanhSachGhiChu } from "./modules/notes/application/use-cases/list-notes.use-case.js";
import { XuLyCapNhatGhiChu } from "./modules/notes/application/use-cases/update-note.use-case.js";
import { KhoGhiChuPostgres } from "./modules/notes/infrastructure/postgres-note.repository.js";
import { KhoBaoCaoTaiLieuPostgres } from "./modules/report-document/infranstructure/postgres-report-document.repository.js";
import { XuLyDanhSachBaoCaoTaiLieu } from "./modules/report-document/application/use-cases/list-report-documents.use-case.js";
import { XuLyLayChiTietBaoCaoTaiLieu } from "./modules/report-document/application/use-cases/get-report-document.use-case.js";
import { XuLyDuyetBaoCaoTaiLieu } from "./modules/report-document/application/use-cases/approve-report-document.use-case.js";
import { XuLyTuChoiBaoCaoTaiLieu } from "./modules/report-document/application/use-cases/reject-report-document.use-case.js";
import { XuLyGuiThongBaoHeThong } from "./modules/notifications/application/use-cases/send-system-notification.use-case.js";
import { DichVuGuiThongBaoDayFirebase } from "./modules/notifications/infrastructure/firebase-push-notification.provider.js";
import { KhoThongBaoHeThongPostgres } from "./modules/notifications/infrastructure/postgres-system-notification.repository.js";
import { XuLyXemChiTietLoiHeThong } from "./modules/system-admin/application/use-cases/get-error-log-detail.use-case.js";
import { XuLyXemDungLuongLuuTru } from "./modules/system-admin/application/use-cases/get-storage-usage.use-case.js";
import { XuLyXemNhatKyHeThong } from "./modules/system-admin/application/use-cases/list-audit-logs.use-case.js";
import { XuLyXemLoiHeThong } from "./modules/system-admin/application/use-cases/list-error-logs.use-case.js";
import { DichVuDungLuongFirebaseStorage } from "./modules/system-admin/infrastructure/firebase-storage-usage.provider.js";
import { KhoDungLuongHeThongPostgres } from "./modules/system-admin/infrastructure/postgres-storage-usage.repository.js";
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
  const khoTamDatLaiMatKhau = new KhoTamDatLaiMatKhauTrongBoNho();
  const khoNhatKyHeThong = new KhoNhatKyHeThongPostgres(coSoDuLieu);
  const khoTruongHoc = new KhoTruongHocPostgres(coSoDuLieu);
  const khoHocThuatTruongHoc = new KhoHocThuatTruongHocPostgres(coSoDuLieu);
  const khoTaiLieu = new KhoTaiLieuPostgres(coSoDuLieu);
  const khoGhiChu = new KhoGhiChuPostgres(coSoDuLieu);
  const khoBaoCaoTaiLieu = new KhoBaoCaoTaiLieuPostgres(coSoDuLieu);
  const khoThongBaoHeThong = new KhoThongBaoHeThongPostgres(coSoDuLieu);
  const khoDungLuongHeThong = new KhoDungLuongHeThongPostgres(coSoDuLieu);

  const boMaHoaMatKhau = new BoMaHoaMatKhauBcrypt();
  const dichVuToken = new DichVuTokenJwt();
  const dichVuGuiEmail = new DichVuGuiEmailSmtp(cauHinh.email.smtp);
  const boKiemTraDanhTinhGoogle = new BoKiemTraDanhTinhGoogleQuaAPI(cauHinh.auth.googleClientIds);
  const dichVuGuiThongBaoDay = new DichVuGuiThongBaoDayFirebase(cauHinh.firebase);
  const dichVuDungLuongFirebase = new DichVuDungLuongFirebaseStorage(cauHinh.firebase);

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
  const xuLyYeuCauQuenMatKhau = new XuLyYeuCauQuenMatKhau({
    khoNguoiDung,
    khoTamDatLaiMatKhau,
    khoNhatKyHeThong,
    dichVuGuiEmail
  });
  const xuLyXacThucMaQuenMatKhau = new XuLyXacThucMaQuenMatKhau({
    khoNguoiDung,
    khoTamDatLaiMatKhau,
    khoNhatKyHeThong
  });
  const xuLyDatLaiMatKhau = new XuLyDatLaiMatKhau({
    khoNguoiDung,
    khoTamDatLaiMatKhau,
    khoPhienDangNhap,
    khoNhatKyHeThong,
    boMaHoaMatKhau,
    giaoDich
  });

  const xuLyLayNguoiDungHienTai = new XuLyLayNguoiDungHienTai({ khoNguoiDung });
  const xuLyDanhSachNguoiDung = new XuLyDanhSachNguoiDung({ khoNguoiDung });
  const xuLyLayChiTietNguoiDung = new XuLyLayChiTietNguoiDung({ khoNguoiDung });
  const xuLyTaoTaiKhoanQuanTri = new XuLyTaoTaiKhoanQuanTri({
    khoNguoiDung,
    khoNhatKyHeThong,
    boMaHoaMatKhau,
    giaoDich,
    dichVuGuiEmail
  });
  const xuLyCapNhatVaiTroNguoiDung = new XuLyCapNhatVaiTroNguoiDung({
    khoNguoiDung,
    khoNhatKyHeThong,
    giaoDich
  });
  const xuLyCapNhatTrangThaiNguoiDung = new XuLyCapNhatTrangThaiNguoiDung({
    khoNguoiDung,
    khoPhienDangNhap,
    khoNhatKyHeThong,
    boMaHoaMatKhau,
    giaoDich
  });
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

  const xuLyUploadChiaSeTaiLieu = new XuLyUploadChiaSeTaiLieu({
    khoTaiLieu,
    khoNhatKyHeThong,
    giaoDich
  });

  const dichVuQuyenGhiChu = new DichVuQuyenGhiChu({
    khoGhiChu,
    khoNhatKyHeThong
  });
  const dichVuTepDinhKemGhiChu = new DichVuTepDinhKemGhiChu({ khoGhiChu });
  const dichVuGhiLogLoiGhiChu = new DichVuGhiLogLoiGhiChu({ khoNhatKyHeThong });
  const phuThuocGhiChuCoBan = {
    khoGhiChu,
    khoNhatKyHeThong,
    giaoDich,
    dichVuQuyenGhiChu,
    dichVuTepDinhKemGhiChu,
    dichVuGhiLogLoiGhiChu
  };

  const xuLyTaoGhiChu = new XuLyTaoGhiChu(phuThuocGhiChuCoBan);
  const xuLyDanhSachGhiChu = new XuLyDanhSachGhiChu({
    khoGhiChu,
    khoNhatKyHeThong
  });
  const xuLyLayChiTietGhiChu = new XuLyLayChiTietGhiChu({ dichVuQuyenGhiChu });
  const xuLyCapNhatGhiChu = new XuLyCapNhatGhiChu(phuThuocGhiChuCoBan);
  const xuLyXoaGhiChu = new XuLyXoaGhiChu({
    khoGhiChu,
    khoNhatKyHeThong,
    giaoDich,
    dichVuQuyenGhiChu,
    dichVuGhiLogLoiGhiChu
  });
  const xuLyDinhKemTaiLieuGhiChu = new XuLyDinhKemTaiLieuGhiChu({
    khoNhatKyHeThong,
    giaoDich,
    dichVuQuyenGhiChu,
    dichVuTepDinhKemGhiChu,
    dichVuGhiLogLoiGhiChu
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
  const xuLyGuiThongBaoHeThong = new XuLyGuiThongBaoHeThong({
    khoThongBaoHeThong,
    khoNhatKyHeThong,
    dichVuGuiThongBaoDay,
    giaoDich
  });
  const xuLyXemDungLuongLuuTru = new XuLyXemDungLuongLuuTru({
    khoDungLuongHeThong,
    dichVuDungLuongFirebase,
    khoNhatKyHeThong
  });
  const xuLyXemNhatKyHeThong = new XuLyXemNhatKyHeThong({ khoNhatKyHeThong });
  const xuLyXemLoiHeThong = new XuLyXemLoiHeThong({ khoNhatKyHeThong });
  const xuLyXemChiTietLoiHeThong = new XuLyXemChiTietLoiHeThong({ khoNhatKyHeThong });

  return {
    coSoDuLieu,
    giaoDich,
    khoNguoiDung,
    khoPhienDangNhap,
    khoTamDatLaiMatKhau,
    khoNhatKyHeThong,
    khoTruongHoc,
    khoHocThuatTruongHoc,
    khoTaiLieu,
    khoGhiChu,
    khoBaoCaoTaiLieu,
    khoThongBaoHeThong,
    khoDungLuongHeThong,
    boMaHoaMatKhau,
    dichVuToken,
    dichVuGuiEmail,
    boKiemTraDanhTinhGoogle,
    dichVuGuiThongBaoDay,
    dichVuDungLuongFirebase,
    xuLyDangNhap,
    xuLyDangNhapGoogle,
    xuLyLamMoiToken,
    xuLyDangXuat,
    xuLyYeuCauQuenMatKhau,
    xuLyXacThucMaQuenMatKhau,
    xuLyDatLaiMatKhau,
    xuLyLayNguoiDungHienTai,
    xuLyDanhSachNguoiDung,
    xuLyLayChiTietNguoiDung,
    xuLyTaoTaiKhoanQuanTri,
    xuLyCapNhatVaiTroNguoiDung,
    xuLyCapNhatTrangThaiNguoiDung,
    xuLyDanhSachTruongHoc,
    xuLyLayChiTietTruongHoc,
    xuLyTaoTruongHoc,
    xuLyCapNhatTruongHoc,
    xuLyXoaTruongHoc,
    xuLyLayCauHinhHocThuatTruongHoc,
    xuLyCapNhatThangDiemTruongHoc,
    xuLyCapNhatQuyCheHocLucTruongHoc,
    xuLyUploadChiaSeTaiLieu,
    xuLyTaoGhiChu,
    xuLyDanhSachGhiChu,
    xuLyLayChiTietGhiChu,
    xuLyCapNhatGhiChu,
    xuLyXoaGhiChu,
    xuLyDinhKemTaiLieuGhiChu,
    xuLyDanhSachBaoCaoTaiLieu,
    xuLyLayChiTietBaoCaoTaiLieu,
    xuLyDuyetBaoCaoTaiLieu,
    xuLyTuChoiBaoCaoTaiLieu,
    xuLyGuiThongBaoHeThong,
    xuLyXemDungLuongLuuTru,
    xuLyXemNhatKyHeThong,
    xuLyXemLoiHeThong,
    xuLyXemChiTietLoiHeThong
  };
};

export const xayDungBoPhuThuoc = () => {
  boPhuThuoc ??= taoBoPhuThuoc();
  return boPhuThuoc;
};



