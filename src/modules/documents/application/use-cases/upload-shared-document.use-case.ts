import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import { nhatKy } from "../../../../shared/logger/logger.js";
import type { DichVuLuuTruTep, TepDaLuuTru } from "../../../../shared/storage/file-storage.provider.js";
import type { CheDoHienThiTaiLieu } from "../../domain/document.js";
import type { KhoTaiLieu } from "../ports/document.repository.js";

type TepTaiLen = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
};

export type LenhUploadChiaSeTaiLieu = {
  actorId: string;
  maMonHoc: string;
  tieuDe: string;
  downloadUrl?: string;
  loaiFile: string;
  dungLuong: number;
  cheDoHienThi: CheDoHienThiTaiLieu;
  tep?: TepTaiLen;
};

type PhuThuoc = {
  khoTaiLieu: KhoTaiLieu;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuLuuTruTep: DichVuLuuTruTep;
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
      await this.ghiNhatKyCanhBao(
        command,
        "DOCUMENT_UPLOAD_COURSE_FORBIDDEN",
        "Sinh viên chia sẻ tài liệu thất bại vì môn học không thuộc quyền sở hữu của sinh viên",
        { maMonHoc: command.maMonHoc }
      );
      throw LoiUngDung.khongCoQuyen("Không thể chia sẻ tài liệu cho môn học này vì bạn không thuộc trong môn học");
    }

    const tepDaLuu = command.tep ? await this.taiTepLenCloud(command) : null;
    const downloadUrl = tepDaLuu?.publicUrl ?? command.downloadUrl;
    const loaiFile = tepDaLuu?.mimeType ?? command.loaiFile;
    const dungLuong = tepDaLuu?.size ?? command.dungLuong;

    if (!downloadUrl) {
      throw LoiUngDung.yeuCauSai("Thiếu file hoặc liên kết tài liệu cần lưu");
    }

    const taiLieuDaTonTai = await this.deps.khoTaiLieu.timTheoDuongDan(downloadUrl);

    if (taiLieuDaTonTai) {
      await this.xoaTepCloudSauLoiNeuCo(tepDaLuu);
      await this.ghiNhatKyCanhBao(
        command,
        "DOCUMENT_UPLOAD_DUPLICATE_URL",
        "Sinh viên chia sẻ tài liệu thất bại vì tài liệu đã tồn tại trong hệ thống",
        {
          maMonHoc: command.maMonHoc,
          existingMaTaiLieu: taiLieuDaTonTai.maTaiLieu
        }
      );
      throw LoiUngDung.xungDot("Tài liệu đã tồn tại trong hệ thống, vui lòng kiểm tra lại");
    }

    try {
      return await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const taiLieu = await this.deps.khoTaiLieu.tao(
          {
            nguoiTaiLen: command.actorId,
            maMonHoc: command.maMonHoc,
            maNhom: null,
            maGhiChu: null,
            duongDanLuuTru: downloadUrl,
            tenFile: command.tieuDe,
            loaiFile,
            dungLuong,
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
            message: "Sinh viên upload tài liệu thành công",
            metadata: {
              maMonHoc: command.maMonHoc,
              tenFile: command.tieuDe,
              loaiFile,
              dungLuong,
              cheDoHienThi: command.cheDoHienThi,
              storageProvider: tepDaLuu?.provider ?? "external_url",
              coDownloadUrl: true
            }
          },
          tx
        );

        return taiLieu;
      });
    } catch (error) {
      await this.xoaTepCloudSauLoiNeuCo(tepDaLuu);
      await this.ghiNhatKyLoiLuuThongTin(command, error);
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống không thể chia sẻ tài liệu lúc này");
    }
  }

  private async taiTepLenCloud(command: LenhUploadChiaSeTaiLieu) {
    if (!command.tep) {
      return null;
    }

    try {
      return await this.deps.dichVuLuuTruTep.taiLen({
        buffer: command.tep.buffer,
        originalName: command.tep.originalName,
        mimeType: command.tep.mimeType,
        size: command.tep.size,
        ownerId: command.actorId,
        folder: command.tep.mimeType.startsWith("video/") ? "videos" : "documents"
      });
    } catch (error) {
      await this.ghiNhatKyLoiUploadCloud(command, error);
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Không thể tải file lên Cloud lúc này");
    }
  }

  private async xoaTepCloudSauLoiNeuCo(tepDaLuu: TepDaLuuTru | null) {
    if (!tepDaLuu) {
      return;
    }

    try {
      await this.deps.dichVuLuuTruTep.xoa(tepDaLuu.storagePath);
    } catch (cleanupError) {
      nhatKy.error("Không thể xóa file Cloud lúc này sau khi lưu metadata thất bại", {
        error: cleanupError,
        storagePath: tepDaLuu.storagePath
      });
    }
  }

  private async ghiNhatKyLoiLuuThongTin(command: LenhUploadChiaSeTaiLieu, error: unknown) {
    try {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "ERROR",
        action: "DOCUMENT_UPLOAD_METADATA_FAILED",
        tableName: "tai_lieu",
        message: "Lỗi lưu thông tin tài liệu vào database",
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

  private async ghiNhatKyLoiUploadCloud(command: LenhUploadChiaSeTaiLieu, error: unknown) {
    try {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "ERROR",
        action: "DOCUMENT_UPLOAD_CLOUDINARY_FAILED",
        tableName: "tai_lieu",
        message: "Lỗi upload file tài liệu lên Cloudinary",
        metadata: {
          maMonHoc: command.maMonHoc,
          tenFile: command.tieuDe,
          loaiFile: command.loaiFile,
          dungLuong: command.dungLuong,
          errorName: layTenLoi(error)
        }
      });
    } catch (auditError) {
      nhatKy.error("Không thể ghi log lỗi upload Cloudinary", {
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
      nhatKy.error("Không thể ghi log cảnh báo upload tài liệu", {
        error: auditError,
        action
      });
    }
  }
}
