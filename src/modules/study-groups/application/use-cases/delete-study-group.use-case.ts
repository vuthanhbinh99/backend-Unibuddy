import type { BoMaHoaMatKhau } from "../../../auth/application/ports/password-hasher.js";
import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoNguoiDung } from "../../../users/application/ports/user.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DichVuGhiLogLoiNhomHocTap } from "../services/study-group-error-logger.service.js";
import type { KhoNhomHocTap } from "../ports/study-group.repository.js";

export type LenhXoaNhomHocTap = {
  actorId: string;
  maNhom: string;
  matKhauXacNhan: string;
};

type PhuThuoc = {
  khoNhomHocTap: KhoNhomHocTap;
  khoNguoiDung: KhoNguoiDung;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  boMaHoaMatKhau: BoMaHoaMatKhau;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiNhomHocTap: DichVuGhiLogLoiNhomHocTap;
};

export class XuLyXoaNhomHocTap {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXoaNhomHocTap) {
    const nhom = await this.deps.khoNhomHocTap.timTheoMa(command.maNhom);

    if (!nhom) {
      await this.deps.dichVuGhiLogLoiNhomHocTap.ghiCanhBao({
        actorId: command.actorId,
        action: "STUDY_GROUP_DELETE_GROUP_NOT_FOUND",
        tableName: "nhom_hoc_tap",
        recordId: command.maNhom,
        message: "Sinh vien giai tan nhom that bai vi khong tim thay nhom hoc tap",
        metadata: {
          maNhom: command.maNhom,
          ruleCode: "BR-GROUP-01"
        }
      });
      throw LoiUngDung.khongTimThay("Không tìm thấy nhóm học tập");
    }

    const thanhVien = await this.deps.khoNhomHocTap.timThanhVien(command.maNhom, command.actorId);

    if (thanhVien?.vaiTroTrongNhom !== "TRUONG_NHOM") {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "WARNING",
        action: "STUDY_GROUP_DELETE_DENIED",
        tableName: "nhom_hoc_tap",
        recordId: command.maNhom,
        message: "Sinh viên không có quyền giải tán nhóm học tập",
        metadata: {
          maNhom: command.maNhom,
          ruleCode: "BR-GROUP-01",
          vaiTroHienTai: thanhVien?.vaiTroTrongNhom ?? null
        }
      });
      throw LoiUngDung.khongCoQuyen(
        "Từ chối thao tác! Chỉ có Trưởng nhóm mới được phép xóa/giải tán nhóm học tập này"
      );
    }

    const nguoiDung = await this.deps.khoNguoiDung.timTheoMa(command.actorId);

    if (!nguoiDung) {
      await this.deps.dichVuGhiLogLoiNhomHocTap.ghiCanhBao({
        actorId: command.actorId,
        action: "STUDY_GROUP_DELETE_USER_NOT_FOUND",
        tableName: "nguoi_dung",
        recordId: command.actorId,
        message: "Sinh vien giai tan nhom that bai vi tai khoan khong ton tai",
        metadata: {
          maNhom: command.maNhom,
          ruleCode: "BR-GROUP-01"
        }
      });
      throw LoiUngDung.khongDuocXacThuc("Người dùng không tồn tại");
    }

    const matKhauHopLe = await this.deps.boMaHoaMatKhau.soSanh(command.matKhauXacNhan, nguoiDung.passwordHash);

    if (!matKhauHopLe) {
      await this.deps.dichVuGhiLogLoiNhomHocTap.ghiCanhBao({
        actorId: command.actorId,
        action: "STUDY_GROUP_DELETE_PASSWORD_INVALID",
        tableName: "nhom_hoc_tap",
        recordId: command.maNhom,
        message: "Sinh vien giai tan nhom that bai vi mat khau xac nhan khong dung",
        metadata: {
          maNhom: command.maNhom,
          ruleCode: "BR-GROUP-01"
        }
      });
      throw LoiUngDung.khongDuocXacThuc("Mật khẩu xác nhận không đúng");
    }

    const thanhVienTrongNhom = await this.deps.khoNhomHocTap.lietKeThanhVien(command.maNhom);

    try {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const soBinhLuanDaXoa = await this.deps.khoNhomHocTap.xoaBinhLuanCongViecTheoNhom(command.maNhom, tx);
        const soCongViecDaXoa = await this.deps.khoNhomHocTap.xoaCongViecTheoNhom(command.maNhom, tx);
        const soThanhVienDaXoa = await this.deps.khoNhomHocTap.xoaThanhVienTheoNhom(command.maNhom, tx);

        const daXoaNhom = await this.deps.khoNhomHocTap.xoaNhom(command.maNhom, tx);

        if (!daXoaNhom) {
          await this.deps.dichVuGhiLogLoiNhomHocTap.ghiCanhBao({
            actorId: command.actorId,
            action: "STUDY_GROUP_DELETE_GROUP_NOT_FOUND_DURING_TRANSACTION",
            tableName: "nhom_hoc_tap",
            recordId: command.maNhom,
            message: "Sinh vien giai tan nhom that bai vi ban ghi nhom khong con ton tai trong transaction",
            metadata: {
              maNhom: command.maNhom,
              ruleCode: "BR-GROUP-01"
            }
          });
          throw LoiUngDung.khongTimThay("Không tìm thấy nhóm học tập");
        }

        await this.deps.khoNhomHocTap.taoThongBaoNhieu(
          {
            actorId: command.actorId,
            nguoiNhanIds: thanhVienTrongNhom.map((item) => item.maNguoiDung),
            tieuDe: "Nhóm học tập đã được giải tán",
            noiDung: `Nhóm học tập ${nhom.tenNhom} đã được giải tán`
          },
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "STUDY_GROUP_DELETED",
            tableName: "nhom_hoc_tap",
            recordId: command.maNhom,
            message: "Sinh viên giải tán nhóm học tập thành công",
            metadata: {
              maNhom: command.maNhom,
              tenNhom: nhom.tenNhom,
              soBinhLuanDaXoa,
              soCongViecDaXoa,
              soThanhVienDaXoa,
              soNguoiNhanThongBao: thanhVienTrongNhom.length,
              ruleCode: "BR-GROUP-01"
            }
          },
          tx
        );
      });

      return {
        message: "Nhóm học tập đã được giải tán thành công và xóa toàn bộ dữ liệu",
        maNhom: command.maNhom
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiNhomHocTap.ghi({
        actorId: command.actorId,
        action: "STUDY_GROUP_DELETE_FAILED",
        tableName: "nhom_hoc_tap",
        recordId: command.maNhom,
        message: "Lỗi giải tán nhóm học tập trong Cơ sở dữ liệu",
        error,
        metadata: {
          maNhom: command.maNhom,
          soThanhVien: thanhVienTrongNhom.length
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể giải tán nhóm học tập lúc này");
    }
  }
}
