import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoDiemSo } from "../ports/grade.repository.js";
import type { DichVuGhiLogLoiDiemSo } from "../services/grade-error-logger.service.js";
import { lapBangDiemTuDuLieu } from "./grade-use-case.helpers.js";

export type LenhXemBangDiem = {
  actorId: string;
  maHocKy?: string | null;
};

type PhuThuoc = {
  khoDiemSo: KhoDiemSo;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuGhiLogLoiDiemSo: DichVuGhiLogLoiDiemSo;
};

export class XuLyXemBangDiem {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXemBangDiem) {
    try {
      if (command.maHocKy) {
        const hocKy = await this.deps.khoDiemSo.timHocKyCuaSinhVien(command.maHocKy, command.actorId);

        if (!hocKy) {
          await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
            actorId: command.actorId,
            action: "GRADE_TRANSCRIPT_SEMESTER_NOT_FOUND",
            tableName: "hoc_ky",
            recordId: command.maHocKy,
            message: "Sinh viên xem bảng điểm thất bại vì học kỳ không thuộc tài khoản",
            metadata: {
              maHocKy: command.maHocKy
            }
          });
          throw LoiUngDung.khongTimThay("Không tìm thấy học kỳ cần xem bảng điểm");
        }
      }

      const monHoc = await this.deps.khoDiemSo.lietKeMonHocBangDiem(command);

      if (monHoc.length === 0) {
        await this.deps.khoNhatKyHeThong.tao({
          actorId: command.actorId,
          level: "INFO",
          action: "GRADE_TRANSCRIPT_VIEWED_EMPTY",
          tableName: "thanh_phan_diem",
          message: "Sinh viên xem bảng điểm - Trạng thái: Chưa có dữ liệu điểm",
          metadata: {
            maHocKy: command.maHocKy ?? null,
            totalCourses: 0
          }
        });

        return {
          message: "Bạn chưa có điểm số nào. Hãy thêm học kỳ và môn học để bắt đầu!",
          totalCourses: 0,
          items: [],
          tongKet: {
            soTinChiDaTinh: 0,
            soTinChiConLai: 0,
            gpaHocKy: null,
            gpaTichLuy: null,
            xepLoaiHocLuc: null
          }
        };
      }

      const maTruongCode = await this.deps.khoDiemSo.layMaTruongCodeSinhVien(command.actorId);

      if (!maTruongCode) {
        await this.ghiCanhBaoThieuCauHinh(command, "GRADE_TRANSCRIPT_SCHOOL_PROFILE_MISSING", {
          reasonCode: "SCHOOL_PROFILE_MISSING"
        });
        throw LoiUngDung.khongTheXuLy("Không thể tính GPA do hệ thống chưa xác định được trường học của sinh viên");
      }

      const [thangDiem, quyCheHocLuc] = await Promise.all([
        this.deps.khoDiemSo.layThangDiem(maTruongCode),
        this.deps.khoDiemSo.layQuyCheHocLuc(maTruongCode)
      ]);

      if (thangDiem.length === 0 || quyCheHocLuc.length === 0) {
        await this.ghiCanhBaoThieuCauHinh(command, "GRADE_TRANSCRIPT_ACADEMIC_RULES_MISSING", {
          maTruongCode,
          hasScoreScale: thangDiem.length > 0,
          hasStandingRules: quyCheHocLuc.length > 0
        });
        throw LoiUngDung.khongTheXuLy("Hệ thống chưa thiết lập cấu hình thang điểm cho trường học này");
      }

      const thanhPhanTheoMon = new Map(
        await Promise.all(
          monHoc.map(async (item) => [item.maMonHoc, await this.deps.khoDiemSo.lietKeThanhPhanTheoMon(item.maMonHoc)] as const)
        )
      );
      const bangDiem = lapBangDiemTuDuLieu(monHoc, thanhPhanTheoMon, thangDiem, quyCheHocLuc);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "INFO",
        action: "GRADE_TRANSCRIPT_VIEWED",
        tableName: "thanh_phan_diem",
        message: "Sinh viên xem bảng điểm và truy xuất GPA thành công",
        metadata: {
          maHocKy: command.maHocKy ?? null,
          totalCourses: bangDiem.items.length,
          gpa: bangDiem.tongKet.gpaTichLuy,
          maTruongCode,
          ruleCodes: ["BR-EDU-03", "BR-EDU-04"]
        }
      });

      return {
        message: "Tải bảng điểm thành công",
        totalCourses: bangDiem.items.length,
        ...bangDiem
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiDiemSo.ghi({
        actorId: command.actorId,
        action: "GRADE_TRANSCRIPT_FAILED",
        tableName: "thanh_phan_diem",
        message: "Lỗi truy vấn bảng điểm và tính toán GPA",
        error,
        metadata: {
          maHocKy: command.maHocKy ?? null
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể tải bảng điểm lúc này");
    }
  }

  private async ghiCanhBaoThieuCauHinh(command: LenhXemBangDiem, action: string, metadata: Record<string, unknown>) {
    await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
      actorId: command.actorId,
      action,
      tableName: "thanh_phan_diem",
      message: "Sinh viên xem bảng điểm thất bại do thiếu cấu hình học thuật",
      metadata: {
        maHocKy: command.maHocKy ?? null,
        ...metadata
      }
    });
  }
}
