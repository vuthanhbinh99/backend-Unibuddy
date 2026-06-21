import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DichVuGhiLogLoiNhomHocTap } from "../services/study-group-error-logger.service.js";
import type { KhoNhomHocTap } from "../ports/study-group.repository.js";

export type LenhRoiNhomHocTap = {
  actorId: string;
  maNhom: string;
};

type PhuThuoc = {
  khoNhomHocTap: KhoNhomHocTap;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiNhomHocTap: DichVuGhiLogLoiNhomHocTap;
};

export class XuLyRoiNhomHocTap {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhRoiNhomHocTap) {
    const nhom = await this.deps.khoNhomHocTap.timTheoMa(command.maNhom);

    if (!nhom) {
      throw LoiUngDung.khongTimThay("Không tìm thấy nhóm học tập");
    }

    const thanhVien = await this.deps.khoNhomHocTap.timThanhVien(command.maNhom, command.actorId);

    if (!thanhVien) {
      throw LoiUngDung.khongTimThay("Bạn không thuộc nhóm học tập này");
    }

    if (thanhVien.vaiTroTrongNhom === "TRUONG_NHOM") {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "WARNING",
        action: "STUDY_GROUP_LEAVE_DENIED",
        tableName: "thanh_vien_nhom",
        recordId: command.maNhom,
        message: "Trưởng nhóm không thể tự rời nhóm",
        metadata: {
          maNhom: command.maNhom,
          ruleCode: "BR-GROUP-01"
        }
      });
      throw LoiUngDung.khongCoQuyen(
        "Bạn đang là Trưởng nhóm. Vui lòng chuyển nhượng quyền Trưởng nhóm cho thành viên khác hoặc chọn 'Xóa nhóm' để giải tán!"
      );
    }

    try {
      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const soCongViecDaBoGan = await this.deps.khoNhomHocTap.capNhatCongViecCuaThanhVienThanhChuaGan(
          command.maNhom,
          command.actorId,
          tx
        );

        await this.deps.khoNhomHocTap.xoaThanhVien(command.maNhom, command.actorId, tx);

        const truongNhom = await this.deps.khoNhomHocTap.lietKeTruongNhom(command.maNhom, tx);

        await this.deps.khoNhomHocTap.taoThongBaoNhieu(
          {
            actorId: command.actorId,
            nguoiNhanIds: truongNhom.map((item) => item.maNguoiDung),
            tieuDe: "Thành viên đã rời khỏi nhóm",
            noiDung: `Thành viên ${thanhVien.hoTen} đã rời khỏi nhóm ${nhom.tenNhom}`
          },
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "STUDY_GROUP_LEFT",
            tableName: "thanh_vien_nhom",
            recordId: command.maNhom,
            message: "Sinh viên rời nhóm học tập thành công",
            metadata: {
              maNhom: command.maNhom,
              soCongViecDaBoGan,
              notifiedLeaderCount: truongNhom.length
            }
          },
          tx
        );
      });

      return {
        message: "Đã rời khỏi nhóm học tập thành công",
        maNhom: command.maNhom
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiNhomHocTap.ghi({
        actorId: command.actorId,
        action: "STUDY_GROUP_LEAVE_FAILED",
        tableName: "thanh_vien_nhom",
        recordId: command.maNhom,
        message: "Lỗi gỡ thành viên khỏi nhóm học tập trong Cơ sở dữ liệu",
        error,
        metadata: {
          maNhom: command.maNhom
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể rời nhóm học tập lúc này");
    }
  }
}
