import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import { nhatKy } from "../../../../shared/logger/logger.js";
import type { CheDoHienThiTaiLieu } from "../../domain/document.js";
import type { KhoTaiLieu } from "../ports/document.repository.js";

export type LenhUploadChiaSeTaiLieu = {
  actorId: string;
  maMonHoc: string;
  tieuDe: string;
  downloadUrl: string;
  loaiFile: string;
  dungLuong: number;
  cheDoHienThi: CheDoHienThiTaiLieu;
};

type PhuThuoc = {
  khoTaiLieu: KhoTaiLieu;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
};

const layTenLoi = (error: unknown) => (error instanceof Error ? error.name : typeof error);

export class XuLyUploadChiaSeTaiLieu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhUploadChiaSeTaiLieu) {
    const monHocThuocSinhVien = await this.deps.khoTaiLieu.kiemTraMonHocThuocSinhVien(
      command.maMonHoc,
      command.actorId
    );

    if (!monHocThuocSinhVien) {
      await this.ghiNhatKyCanhBao(command, "DOCUMENT_UPLOAD_COURSE_FORBIDDEN", "Sinh vien chia se tai lieu that bai vi mon hoc khong thuoc sinh vien", {
        maMonHoc: command.maMonHoc
      });
      throw LoiUngDung.khongCoQuyen("Không thể chia sẻ tài liệu cho môn học này vì bạn không thuộc trong môn học");
    }

    const taiLieuDaTonTai = await this.deps.khoTaiLieu.timTheoDuongDan(command.downloadUrl);

    if (taiLieuDaTonTai) {
      await this.ghiNhatKyCanhBao(command, "DOCUMENT_UPLOAD_DUPLICATE_URL", "Sinh vien chia se tai lieu that bai vi tai lieu da ton tai trong he thong", {
        maMonHoc: command.maMonHoc,
        existingMaTaiLieu: taiLieuDaTonTai.maTaiLieu
      });
      throw LoiUngDung.xungDot("Tài liệu này đã được lưu trong hệ thống, vui lòng kiểm tra lại đường dẫn tải về");
    }

    try {
      return await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const taiLieu = await this.deps.khoTaiLieu.tao(
          {
            nguoiTaiLen: command.actorId,
            maMonHoc: command.maMonHoc,
            maNhom: null,
            maGhiChu: null,
            duongDanLuuTru: command.downloadUrl,
            tenFile: command.tieuDe,
            loaiFile: command.loaiFile,
            dungLuong: command.dungLuong,
            cheDoHienThi: command.cheDoHienThi,
            trangThai: "KHA_DUNG"
          },
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "DOCUMENT_UPLOADED",
            tableName: "tai_lieu",
            recordId: taiLieu.maTaiLieu,
            message: "Sinh viên upload tài liệu  thành công",
            metadata: {
              maMonHoc: command.maMonHoc,
              tenFile: command.tieuDe,
              loaiFile: command.loaiFile,
              dungLuong: command.dungLuong,
              cheDoHienThi: command.cheDoHienThi,
              coDownloadUrl: true
            }
          },
          tx
        );

        return taiLieu;
      });
    } catch (error) {
      await this.ghiNhatKyLoiLuuThongTin(command, error);
      throw new LoiUngDung(
        500,
        CacLoi.INTERNAL_ERROR,
        "Hệ thống bận không thể chia sẻ tài liệu lúc này"
      );
    }
  }

  private async ghiNhatKyLoiLuuThongTin(command: LenhUploadChiaSeTaiLieu, error: unknown) {
    try {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "ERROR",
        action: "DOCUMENT_UPLOAD_METADATA_FAILED",
        tableName: "tai_lieu",
        message: "Lỗi Lưu thông tin tài liệu vào database",
        metadata: {
          maMonHoc: command.maMonHoc,
          tenFile: command.tieuDe,
          loaiFile: command.loaiFile,
          dungLuong: command.dungLuong,
          cheDoHienThi: command.cheDoHienThi,
          errorName: layTenLoi(error)
        }
      });
    } catch (auditError) {
      nhatKy.error("Không thể ghi log upload tài liệu", {
        error: auditError,
        originalErrorName: layTenLoi(error)
      });
    }
  }

  private async ghiNhatKyCanhBao(
    command: LenhUploadChiaSeTaiLieu,
    action: string,
    message: string,
    metadata: Record<string, unknown>
  ) {
    try {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "WARNING",
        action,
        tableName: "tai_lieu",
        message,
        metadata: {
          tenFile: command.tieuDe,
          loaiFile: command.loaiFile,
          dungLuong: command.dungLuong,
          cheDoHienThi: command.cheDoHienThi,
          ...metadata
        }
      });
    } catch (auditError) {
      nhatKy.error("KhÃ´ng thá»ƒ ghi log cáº£nh bÃ¡o upload tÃ i liá»‡u", {
        error: auditError,
        action
      });
    }
  }
}
