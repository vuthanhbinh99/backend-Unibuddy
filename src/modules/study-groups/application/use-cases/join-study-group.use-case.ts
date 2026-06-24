import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DichVuGhiLogLoiNhomHocTap } from "../services/study-group-error-logger.service.js";
import type { KhoNhomHocTap } from "../ports/study-group.repository.js";

export type LenhThamGiaNhomHocTap = {
  actorId: string;
  maThamGia: string;
};

type PhuThuoc = {
  khoNhomHocTap: KhoNhomHocTap;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiNhomHocTap: DichVuGhiLogLoiNhomHocTap;
};

export class XuLyThamGiaNhomHocTap {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhThamGiaNhomHocTap) {
    const nhom = await this.deps.khoNhomHocTap.timTheoMaThamGia(command.maThamGia);

    if (!nhom) {
      await this.deps.dichVuGhiLogLoiNhomHocTap.ghiCanhBao({
        actorId: command.actorId,
        action: "STUDY_GROUP_JOIN_INVITE_NOT_FOUND",
        tableName: "nhom_hoc_tap",
        message: "Sinh vien tham gia nhom that bai vi ma moi khong chinh xac",
        metadata: {
          maThamGia: command.maThamGia
        }
      });
      throw LoiUngDung.khongTimThay("Mã mời không chính xác");
    }

    const thanhVienHienTai = await this.deps.khoNhomHocTap.timThanhVien(nhom.maNhom, command.actorId);

    if (thanhVienHienTai) {
      await this.deps.dichVuGhiLogLoiNhomHocTap.ghiCanhBao({
        actorId: command.actorId,
        action: "STUDY_GROUP_JOIN_DUPLICATE_MEMBER",
        tableName: "thanh_vien_nhom",
        recordId: nhom.maNhom,
        message: "Sinh vien tham gia nhom that bai vi da la thanh vien tu truoc",
        metadata: {
          maNhom: nhom.maNhom,
          vaiTroHienTai: thanhVienHienTai.vaiTroTrongNhom
        }
      });
      throw LoiUngDung.xungDot("Bạn đã tham gia nhóm này từ trước");
    }

    try {
      const thanhVien = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const thanhVienMoi = await this.deps.khoNhomHocTap.themThanhVien(
          nhom.maNhom,
          command.actorId,
          "THANH_VIEN",
          tx
        );
        const truongNhom = await this.deps.khoNhomHocTap.lietKeTruongNhom(nhom.maNhom, tx);

        await this.deps.khoNhomHocTap.taoThongBaoNhieu(
          {
            actorId: command.actorId,
            nguoiNhanIds: truongNhom.map((item) => item.maNguoiDung),
            tieuDe: "Thành viên mới tham gia nhóm",
            noiDung: `Sinh viên ${thanhVienMoi.hoTen} đã tham gia vào nhóm bằng mã`
          },
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "STUDY_GROUP_JOINED",
            tableName: "thanh_vien_nhom",
            recordId: nhom.maNhom,
            message: "Sinh viên đã tham gia vào nhóm học tập bằng mã",
            metadata: {
              maNhom: nhom.maNhom,
              vaiTro: "THANH_VIEN",
              notifiedLeaderCount: truongNhom.length
            }
          },
          tx
        );

        return thanhVienMoi;
      });

      return {
        message: "Bạn đã tham gia vào nhóm học tập thành công",
        nhom,
        thanhVien
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiNhomHocTap.ghi({
        actorId: command.actorId,
        action: "STUDY_GROUP_JOIN_FAILED",
        tableName: "thanh_vien_nhom",
        recordId: nhom.maNhom,
        message: "Lỗi lưu thông tin thành viên nhóm học tập vào database",
        error,
        metadata: {
          maNhom: nhom.maNhom
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể tham gia nhóm học tập lúc này");
    }
  }
}
