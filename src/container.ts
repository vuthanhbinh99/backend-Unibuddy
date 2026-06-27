import { BoMaHoaMatKhauBcrypt } from "./modules/auth/infrastructure/bcrypt-password-hasher.js";
import { BoKiemTraDanhTinhGoogleQuaAPI } from "./modules/auth/infrastructure/google-token-info.verifier.js";
import { DichVuTokenJwt } from "./modules/auth/infrastructure/jwt-token.service.js";
import { KhoPhienDangNhapPostgres } from "./modules/auth/infrastructure/postgres-session.repository.js";
import { KhoDangKySinhVienPostgres } from "./modules/auth/infrastructure/postgres-student-registration.repository.js";
import { KhoTamDatLaiMatKhauTrongBoNho } from "./modules/auth/infrastructure/in-memory-forgot-password-cache.js";
import { XuLyDangNhapGoogle } from "./modules/auth/application/use-cases/google-login.use-case.js";
import { XuLyDangNhap } from "./modules/auth/application/use-cases/login.use-case.js";
import { XuLyDangXuat } from "./modules/auth/application/use-cases/logout.use-case.js";
import { XuLyLamMoiToken } from "./modules/auth/application/use-cases/refresh-token.use-case.js";
import { XuLyDangKySinhVien } from "./modules/auth/application/use-cases/register-student.use-case.js";
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
import { DichVuGhiLogLoiDeadline } from "./modules/deadlines/application/services/deadline-error-logger.service.js";
import { XuLyTaoDeadline } from "./modules/deadlines/application/use-cases/create-deadline.use-case.js";
import { XuLyXoaDeadline } from "./modules/deadlines/application/use-cases/delete-deadline.use-case.js";
import { XuLyDanhSachDeadline } from "./modules/deadlines/application/use-cases/list-deadlines.use-case.js";
import { XuLyCapNhatTrangThaiDeadline } from "./modules/deadlines/application/use-cases/update-deadline-status.use-case.js";
import { KhoDeadlinePostgres } from "./modules/deadlines/infrastructure/postgres-deadline.repository.js";
import { XuLyUploadChiaSeTaiLieu } from "./modules/documents/application/use-cases/upload-shared-document.use-case.js";
import { KhoTaiLieuPostgres } from "./modules/documents/infrastructure/postgres-document.repository.js";
import { XuLyCauHinhTrongSoDiem } from "./modules/grades/application/use-cases/configure-grade-weights.use-case.js";
import { XuLyXacNhanImportDiemSo } from "./modules/grades/application/use-cases/confirm-grade-import.use-case.js";
import { XuLyTaoThanhPhanDiem } from "./modules/grades/application/use-cases/create-grade-component.use-case.js";
import { XuLyTrichXuatHeaderImportDiemSo } from "./modules/grades/application/use-cases/extract-grade-import-headers.use-case.js";
import { XuLyXemBangDiem } from "./modules/grades/application/use-cases/list-grade-transcript.use-case.js";
import { XuLyPreviewImportDiemSo } from "./modules/grades/application/use-cases/preview-grade-import.use-case.js";
import { XuLyDuPhongGpa } from "./modules/grades/application/use-cases/project-gpa.use-case.js";
import { XuLyCapNhatThanhPhanDiem } from "./modules/grades/application/use-cases/update-grade-component.use-case.js";
import { DichVuGhiLogLoiDiemSo } from "./modules/grades/application/services/grade-error-logger.service.js";
import { DichVuMappingImportDiemSo } from "./modules/grades/application/services/grade-import-mapper.service.js";
import { KhoDiemSoPostgres } from "./modules/grades/infrastructure/postgres-grade.repository.js";
import { BoDocTepImportDiemSoXlsxText } from "./modules/grades/infrastructure/xlsx-text-grade-import-parser.js";
import { DichVuGhiLogLoiHocPhan } from "./modules/courses/application/services/course-error-logger.service.js";
import { XuLyTaoHocPhan } from "./modules/courses/application/use-cases/create-course.use-case.js";
import { XuLyTaoHocKy } from "./modules/courses/application/use-cases/create-semester.use-case.js";
import { XuLyXoaHocPhan } from "./modules/courses/application/use-cases/delete-course.use-case.js";
import { XuLyChiTietHocPhan } from "./modules/courses/application/use-cases/get-course-detail.use-case.js";
import { XuLyDanhSachHocPhan } from "./modules/courses/application/use-cases/list-courses.use-case.js";
import { XuLyCapNhatHocPhan } from "./modules/courses/application/use-cases/update-course.use-case.js";
import { KhoHocPhanPostgres } from "./modules/courses/infrastructure/postgres-course.repository.js";
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
import { DichVuGhiLogLoiThoiKhoaBieu } from "./modules/schedules/application/services/schedule-error-logger.service.js";
import { DichVuMappingImportThoiKhoaBieu } from "./modules/schedules/application/services/schedule-import-mapper.service.js";
import { XuLyXacNhanImportThoiKhoaBieu } from "./modules/schedules/application/use-cases/confirm-schedule-import.use-case.js";
import { XuLyTaoLichHoc } from "./modules/schedules/application/use-cases/create-schedule.use-case.js";
import { XuLyXoaLichHoc } from "./modules/schedules/application/use-cases/delete-schedule.use-case.js";
import { XuLyTrichXuatHeaderImportThoiKhoaBieu } from "./modules/schedules/application/use-cases/extract-schedule-import-headers.use-case.js";
import { XuLyDanhSachLichHoc } from "./modules/schedules/application/use-cases/list-schedules.use-case.js";
import { XuLyPreviewImportThoiKhoaBieu } from "./modules/schedules/application/use-cases/preview-schedule-import.use-case.js";
import { XuLyCapNhatLichHoc } from "./modules/schedules/application/use-cases/update-schedule.use-case.js";
import { KhoLichHocPostgres } from "./modules/schedules/infrastructure/postgres-schedule.repository.js";
import { BoDocTepImportThoiKhoaBieuXlsxPdf } from "./modules/schedules/infrastructure/xlsx-pdf-schedule-import-parser.js";
import { DichVuGhiLogLoiNhomHocTap } from "./modules/study-groups/application/services/study-group-error-logger.service.js";
import { XuLyTaoNhomHocTap } from "./modules/study-groups/application/use-cases/create-study-group.use-case.js";
import { XuLyXoaNhomHocTap } from "./modules/study-groups/application/use-cases/delete-study-group.use-case.js";
import { XuLyThamGiaNhomHocTap } from "./modules/study-groups/application/use-cases/join-study-group.use-case.js";
import { XuLyRoiNhomHocTap } from "./modules/study-groups/application/use-cases/leave-study-group.use-case.js";
import { KhoNhomHocTapPostgres } from "./modules/study-groups/infrastructure/postgres-study-group.repository.js";
import { DichVuGhiLogLoiKanban } from "./modules/kanban/application/services/kanban-error-logger.service.js";
import { XuLyPhanCongCongViecKanban } from "./modules/kanban/application/use-cases/assign-kanban-task.use-case.js";
import { XuLyBinhLuanCongViecKanban } from "./modules/kanban/application/use-cases/comment-kanban-task.use-case.js";
import { XuLyTaoCongViecKanban } from "./modules/kanban/application/use-cases/create-kanban-task.use-case.js";
import { XuLyXoaCongViecKanban } from "./modules/kanban/application/use-cases/delete-kanban-task.use-case.js";
import { XuLyLayLienKetNhomChatKanban } from "./modules/kanban/application/use-cases/get-kanban-chat-link.use-case.js";
import { XuLyXemBangKanban } from "./modules/kanban/application/use-cases/list-kanban-board.use-case.js";
import { XuLyThuHoiBinhLuanCongViecKanban } from "./modules/kanban/application/use-cases/revoke-kanban-task-comment.use-case.js";
import { XuLyCapNhatThongTinCongViecKanban } from "./modules/kanban/application/use-cases/update-kanban-task-details.use-case.js";
import { XuLyCapNhatTrangThaiCongViecKanban } from "./modules/kanban/application/use-cases/update-kanban-task-status.use-case.js";
import { KhoKanbanPostgres } from "./modules/kanban/infrastructure/postgres-kanban.repository.js";
import { DichVuGhiLogLoiFlashcard } from "./modules/flashcards/application/services/flashcard-error-logger.service.js";
import { XuLyTaoBoFlashcard } from "./modules/flashcards/application/use-cases/create-flashcard-deck.use-case.js";
import { XuLyTaoTheFlashcard } from "./modules/flashcards/application/use-cases/create-flashcard.use-case.js";
import { XuLyXoaBoFlashcard } from "./modules/flashcards/application/use-cases/delete-flashcard-deck.use-case.js";
import { XuLyXoaTheFlashcard } from "./modules/flashcards/application/use-cases/delete-flashcard.use-case.js";
import { XuLyThongKeFlashcard } from "./modules/flashcards/application/use-cases/get-flashcard-statistics.use-case.js";
import { XuLyImportFlashcards } from "./modules/flashcards/application/use-cases/import-flashcards.use-case.js";
import { XuLyDanhSachBoFlashcard } from "./modules/flashcards/application/use-cases/list-flashcard-decks.use-case.js";
import { XuLyBatDauOnTapFlashcard } from "./modules/flashcards/application/use-cases/start-flashcard-review.use-case.js";
import { XuLyCapNhatBoFlashcard } from "./modules/flashcards/application/use-cases/update-flashcard-deck.use-case.js";
import { XuLyCapNhatTheFlashcard } from "./modules/flashcards/application/use-cases/update-flashcard.use-case.js";
import { XuLyCapNhatTienDoFlashcard } from "./modules/flashcards/application/use-cases/update-flashcard-progress.use-case.js";
import { KhoFlashcardPostgres } from "./modules/flashcards/infrastructure/postgres-flashcard.repository.js";
import { BoDocTepImportFlashcardXlsxCsv } from "./modules/flashcards/infrastructure/xlsx-csv-flashcard-import-parser.js";
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
  const khoDangKySinhVien = new KhoDangKySinhVienPostgres(coSoDuLieu);
  const khoTamDatLaiMatKhau = new KhoTamDatLaiMatKhauTrongBoNho();
  const khoNhatKyHeThong = new KhoNhatKyHeThongPostgres(coSoDuLieu);
  const khoTruongHoc = new KhoTruongHocPostgres(coSoDuLieu);
  const khoHocThuatTruongHoc = new KhoHocThuatTruongHocPostgres(coSoDuLieu);
  const khoTaiLieu = new KhoTaiLieuPostgres(coSoDuLieu);
  const khoDeadline = new KhoDeadlinePostgres(coSoDuLieu);
  const khoHocPhan = new KhoHocPhanPostgres(coSoDuLieu);
  const khoDiemSo = new KhoDiemSoPostgres(coSoDuLieu);
  const khoGhiChu = new KhoGhiChuPostgres(coSoDuLieu);
  const khoLichHoc = new KhoLichHocPostgres(coSoDuLieu);
  const khoNhomHocTap = new KhoNhomHocTapPostgres(coSoDuLieu);
  const khoKanban = new KhoKanbanPostgres(coSoDuLieu);
  const khoFlashcard = new KhoFlashcardPostgres(coSoDuLieu);
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

  const xuLyDangKySinhVien = new XuLyDangKySinhVien({
    khoNguoiDung,
    khoDangKySinhVien,
    khoNhatKyHeThong,
    boMaHoaMatKhau,
    giaoDich,
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

  const dichVuGhiLogLoiHocPhan = new DichVuGhiLogLoiHocPhan({ khoNhatKyHeThong });
  const dichVuGhiLogLoiDeadline = new DichVuGhiLogLoiDeadline({ khoNhatKyHeThong });
  const dichVuQuyenGhiChu = new DichVuQuyenGhiChu({
    khoGhiChu,
    khoNhatKyHeThong
  });
  const dichVuTepDinhKemGhiChu = new DichVuTepDinhKemGhiChu({
    khoGhiChu,
    khoNhatKyHeThong
  });
  const dichVuGhiLogLoiGhiChu = new DichVuGhiLogLoiGhiChu({ khoNhatKyHeThong });
  const dichVuGhiLogLoiThoiKhoaBieu = new DichVuGhiLogLoiThoiKhoaBieu({ khoNhatKyHeThong });
  const dichVuMappingImportThoiKhoaBieu = new DichVuMappingImportThoiKhoaBieu();
  const boDocTepImportThoiKhoaBieu = new BoDocTepImportThoiKhoaBieuXlsxPdf();
  const dichVuGhiLogLoiDiemSo = new DichVuGhiLogLoiDiemSo({ khoNhatKyHeThong });
  const dichVuMappingImportDiemSo = new DichVuMappingImportDiemSo();
  const boDocTepImportDiemSo = new BoDocTepImportDiemSoXlsxText();
  const dichVuGhiLogLoiNhomHocTap = new DichVuGhiLogLoiNhomHocTap({ khoNhatKyHeThong });
  const dichVuGhiLogLoiKanban = new DichVuGhiLogLoiKanban({ khoNhatKyHeThong });
  const dichVuGhiLogLoiFlashcard = new DichVuGhiLogLoiFlashcard({ khoNhatKyHeThong });
  const boDocTepImportFlashcard = new BoDocTepImportFlashcardXlsxCsv();
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

  const phuThuocHocPhanCoBan = {
    khoHocPhan,
    khoNhatKyHeThong,
    giaoDich,
    dichVuGhiLogLoiHocPhan
  };
  const xuLyDanhSachHocPhan = new XuLyDanhSachHocPhan({ khoHocPhan });
  const xuLyChiTietHocPhan = new XuLyChiTietHocPhan({ khoHocPhan });
  const xuLyTaoHocKy = new XuLyTaoHocKy(phuThuocHocPhanCoBan);
  const xuLyTaoHocPhan = new XuLyTaoHocPhan(phuThuocHocPhanCoBan);
  const xuLyCapNhatHocPhan = new XuLyCapNhatHocPhan(phuThuocHocPhanCoBan);
  const xuLyXoaHocPhan = new XuLyXoaHocPhan(phuThuocHocPhanCoBan);

  const phuThuocDeadlineCoBan = {
    khoDeadline,
    khoNhatKyHeThong,
    giaoDich,
    dichVuGhiLogLoiDeadline
  };
  const xuLyDanhSachDeadline = new XuLyDanhSachDeadline({
    khoDeadline,
    khoNhatKyHeThong,
    dichVuGhiLogLoiDeadline
  });
  const xuLyTaoDeadline = new XuLyTaoDeadline(phuThuocDeadlineCoBan);
  const xuLyCapNhatTrangThaiDeadline = new XuLyCapNhatTrangThaiDeadline(phuThuocDeadlineCoBan);
  const xuLyXoaDeadline = new XuLyXoaDeadline(phuThuocDeadlineCoBan);

  const phuThuocLichHocCoBan = {
    khoLichHoc,
    khoNhatKyHeThong,
    giaoDich,
    dichVuGhiLogLoiThoiKhoaBieu
  };
  const xuLyDanhSachLichHoc = new XuLyDanhSachLichHoc({ khoLichHoc });
  const xuLyTaoLichHoc = new XuLyTaoLichHoc(phuThuocLichHocCoBan);
  const xuLyCapNhatLichHoc = new XuLyCapNhatLichHoc(phuThuocLichHocCoBan);
  const xuLyXoaLichHoc = new XuLyXoaLichHoc(phuThuocLichHocCoBan);
  const xuLyTrichXuatHeaderImportThoiKhoaBieu = new XuLyTrichXuatHeaderImportThoiKhoaBieu({
    boDocTepImportThoiKhoaBieu,
    dichVuGhiLogLoiThoiKhoaBieu
  });
  const xuLyPreviewImportThoiKhoaBieu = new XuLyPreviewImportThoiKhoaBieu({
    khoLichHoc,
    dichVuMappingImportThoiKhoaBieu,
    dichVuGhiLogLoiThoiKhoaBieu
  });
  const xuLyXacNhanImportThoiKhoaBieu = new XuLyXacNhanImportThoiKhoaBieu({
    ...phuThuocLichHocCoBan,
    khoHocPhan
  });

  const phuThuocDiemSoCoBan = {
    khoDiemSo,
    khoNhatKyHeThong,
    giaoDich,
    dichVuGhiLogLoiDiemSo
  };
  const xuLyXemBangDiem = new XuLyXemBangDiem({
    khoDiemSo,
    khoNhatKyHeThong,
    dichVuGhiLogLoiDiemSo
  });
  const xuLyTaoThanhPhanDiem = new XuLyTaoThanhPhanDiem(phuThuocDiemSoCoBan);
  const xuLyCapNhatThanhPhanDiem = new XuLyCapNhatThanhPhanDiem(phuThuocDiemSoCoBan);
  const xuLyCauHinhTrongSoDiem = new XuLyCauHinhTrongSoDiem(phuThuocDiemSoCoBan);
  const xuLyDuPhongGpa = new XuLyDuPhongGpa({
    khoDiemSo,
    khoNhatKyHeThong,
    dichVuGhiLogLoiDiemSo
  });
  const xuLyTrichXuatHeaderImportDiemSo = new XuLyTrichXuatHeaderImportDiemSo({
    boDocTepImportDiemSo,
    dichVuGhiLogLoiDiemSo
  });
  const xuLyPreviewImportDiemSo = new XuLyPreviewImportDiemSo({
    khoDiemSo,
    dichVuMappingImportDiemSo,
    dichVuGhiLogLoiDiemSo
  });
  const xuLyXacNhanImportDiemSo = new XuLyXacNhanImportDiemSo({
    ...phuThuocDiemSoCoBan
  });

  const phuThuocNhomHocTapCoBan = {
    khoNhomHocTap,
    khoNhatKyHeThong,
    giaoDich,
    dichVuGhiLogLoiNhomHocTap
  };
  const xuLyTaoNhomHocTap = new XuLyTaoNhomHocTap({
    ...phuThuocNhomHocTapCoBan,
    khoLichHoc
  });
  const xuLyThamGiaNhomHocTap = new XuLyThamGiaNhomHocTap(phuThuocNhomHocTapCoBan);
  const xuLyRoiNhomHocTap = new XuLyRoiNhomHocTap(phuThuocNhomHocTapCoBan);
  const xuLyXoaNhomHocTap = new XuLyXoaNhomHocTap({
    ...phuThuocNhomHocTapCoBan,
    khoNguoiDung,
    boMaHoaMatKhau
  });

  const phuThuocKanbanCoBan = {
    khoKanban,
    khoNhatKyHeThong,
    giaoDich,
    dichVuGhiLogLoiKanban
  };
  const xuLyXemBangKanban = new XuLyXemBangKanban(phuThuocKanbanCoBan);
  const xuLyTaoCongViecKanban = new XuLyTaoCongViecKanban(phuThuocKanbanCoBan);
  const xuLyCapNhatThongTinCongViecKanban = new XuLyCapNhatThongTinCongViecKanban(phuThuocKanbanCoBan);
  const xuLyCapNhatTrangThaiCongViecKanban = new XuLyCapNhatTrangThaiCongViecKanban(phuThuocKanbanCoBan);
  const xuLyPhanCongCongViecKanban = new XuLyPhanCongCongViecKanban(phuThuocKanbanCoBan);
  const xuLyXoaCongViecKanban = new XuLyXoaCongViecKanban(phuThuocKanbanCoBan);
  const xuLyBinhLuanCongViecKanban = new XuLyBinhLuanCongViecKanban(phuThuocKanbanCoBan);
  const xuLyThuHoiBinhLuanCongViecKanban = new XuLyThuHoiBinhLuanCongViecKanban(phuThuocKanbanCoBan);
  const xuLyLayLienKetNhomChatKanban = new XuLyLayLienKetNhomChatKanban({
    khoKanban,
    khoNhatKyHeThong,
    dichVuGhiLogLoiKanban
  });

  const phuThuocFlashcardCoBan = {
    khoFlashcard,
    khoNhatKyHeThong,
    giaoDich,
    dichVuGhiLogLoiFlashcard
  };
  const xuLyDanhSachBoFlashcard = new XuLyDanhSachBoFlashcard({
    khoFlashcard,
    khoNhatKyHeThong,
    dichVuGhiLogLoiFlashcard
  });
  const xuLyTaoBoFlashcard = new XuLyTaoBoFlashcard(phuThuocFlashcardCoBan);
  const xuLyCapNhatBoFlashcard = new XuLyCapNhatBoFlashcard(phuThuocFlashcardCoBan);
  const xuLyXoaBoFlashcard = new XuLyXoaBoFlashcard(phuThuocFlashcardCoBan);
  const xuLyTaoTheFlashcard = new XuLyTaoTheFlashcard(phuThuocFlashcardCoBan);
  const xuLyImportFlashcards = new XuLyImportFlashcards({
    ...phuThuocFlashcardCoBan,
    boDocTepImportFlashcard
  });
  const xuLyCapNhatTheFlashcard = new XuLyCapNhatTheFlashcard(phuThuocFlashcardCoBan);
  const xuLyXoaTheFlashcard = new XuLyXoaTheFlashcard(phuThuocFlashcardCoBan);
  const xuLyBatDauOnTapFlashcard = new XuLyBatDauOnTapFlashcard({
    khoFlashcard,
    khoNhatKyHeThong,
    dichVuGhiLogLoiFlashcard
  });
  const xuLyCapNhatTienDoFlashcard = new XuLyCapNhatTienDoFlashcard(phuThuocFlashcardCoBan);
  const xuLyThongKeFlashcard = new XuLyThongKeFlashcard({
    khoFlashcard,
    khoNhatKyHeThong,
    dichVuGhiLogLoiFlashcard
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
    khoDangKySinhVien,
    khoTamDatLaiMatKhau,
    khoNhatKyHeThong,
    khoTruongHoc,
    khoHocThuatTruongHoc,
    khoTaiLieu,
    khoDeadline,
    khoHocPhan,
    khoDiemSo,
    khoGhiChu,
    khoLichHoc,
    khoNhomHocTap,
    khoKanban,
    khoFlashcard,
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
    xuLyDangKySinhVien,
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
    xuLyDanhSachHocPhan,
    xuLyChiTietHocPhan,
    xuLyTaoHocKy,
    xuLyTaoHocPhan,
    xuLyCapNhatHocPhan,
    xuLyXoaHocPhan,
    xuLyDanhSachDeadline,
    xuLyTaoDeadline,
    xuLyCapNhatTrangThaiDeadline,
    xuLyXoaDeadline,
    xuLyTaoGhiChu,
    xuLyDanhSachGhiChu,
    xuLyLayChiTietGhiChu,
    xuLyCapNhatGhiChu,
    xuLyXoaGhiChu,
    xuLyDinhKemTaiLieuGhiChu,
    xuLyDanhSachLichHoc,
    xuLyTaoLichHoc,
    xuLyCapNhatLichHoc,
    xuLyXoaLichHoc,
    xuLyTrichXuatHeaderImportThoiKhoaBieu,
    xuLyPreviewImportThoiKhoaBieu,
    xuLyXacNhanImportThoiKhoaBieu,
    xuLyXemBangDiem,
    xuLyTaoThanhPhanDiem,
    xuLyCapNhatThanhPhanDiem,
    xuLyCauHinhTrongSoDiem,
    xuLyDuPhongGpa,
    xuLyTrichXuatHeaderImportDiemSo,
    xuLyPreviewImportDiemSo,
    xuLyXacNhanImportDiemSo,
    xuLyTaoNhomHocTap,
    xuLyThamGiaNhomHocTap,
    xuLyRoiNhomHocTap,
    xuLyXoaNhomHocTap,
    xuLyXemBangKanban,
    xuLyTaoCongViecKanban,
    xuLyCapNhatThongTinCongViecKanban,
    xuLyCapNhatTrangThaiCongViecKanban,
    xuLyPhanCongCongViecKanban,
    xuLyXoaCongViecKanban,
    xuLyBinhLuanCongViecKanban,
    xuLyThuHoiBinhLuanCongViecKanban,
    xuLyLayLienKetNhomChatKanban,
    xuLyDanhSachBoFlashcard,
    xuLyTaoBoFlashcard,
    xuLyCapNhatBoFlashcard,
    xuLyXoaBoFlashcard,
    xuLyTaoTheFlashcard,
    xuLyImportFlashcards,
    xuLyCapNhatTheFlashcard,
    xuLyXoaTheFlashcard,
    xuLyBatDauOnTapFlashcard,
    xuLyCapNhatTienDoFlashcard,
    xuLyThongKeFlashcard,
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



