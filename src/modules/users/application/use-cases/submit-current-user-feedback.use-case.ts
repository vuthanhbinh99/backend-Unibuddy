import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import { nhatKy } from "../../../../shared/logger/logger.js";
import type { DichVuLuuTruTep, TepDaLuuTru } from "../../../../shared/storage/file-storage.provider.js";

export type LenhGuiPhanHoiNguoiDungHienTai = {
  actorId: string;
  category: "bug" | "feature" | "ui" | "other";
  message: string;
  tep?: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
  };
};

type PhuThuoc = {
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuLuuTruTep: DichVuLuuTruTep;
};

const CAC_LOAI_ANH_HOP_LE = new Set(["image/png", "image/jpeg", "image/webp"]);

const layTenLoi = (error: unknown) => (error instanceof Error ? error.name : typeof error);

export class XuLyGuiPhanHoiNguoiDungHienTai {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhGuiPhanHoiNguoiDungHienTai): Promise<{ message: string }> {
    let tepDaLuu: TepDaLuuTru | null = null;

    try {
      if (command.tep) {
        if (!CAC_LOAI_ANH_HOP_LE.has(command.tep.mimeType)) {
          throw LoiUngDung.yeuCauSai("Chỉ hỗ trợ upload ảnh PNG, JPG hoặc WebP");
        }

        tepDaLuu = await this.deps.dichVuLuuTruTep.taiLen({
          buffer: command.tep.buffer,
          originalName: command.tep.originalName,
          mimeType: command.tep.mimeType,
          size: command.tep.size,
          ownerId: command.actorId,
          folder: "attachments"
        });
      }

      await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "USER_FEEDBACK_SUBMITTED",
            tableName: "nhat_ky_he_thong",
            message: "Người dùng gửi phản hồi",
            metadata: {
              category: command.category,
              message: command.message.trim(),
              attachmentFileName: command.tep?.originalName ?? null,
              attachmentMimeType: command.tep?.mimeType ?? null,
              attachmentSizeBytes: command.tep?.size ?? null,
              attachmentPublicUrl: tepDaLuu?.publicUrl ?? null,
              attachmentStorageProvider: tepDaLuu?.provider ?? null
            }
          },
          tx
        );
      });

      return { message: "Gửi phản hồi thành công" };
    } catch (error) {
      if (tepDaLuu) {
        try {
          await this.deps.dichVuLuuTruTep.xoa(tepDaLuu.storagePath);
        } catch (cleanupError) {
          nhatKy.error("Không thể xóa ảnh feedback sau khi lưu thất bại", {
            error: cleanupError,
            storagePath: tepDaLuu.storagePath
          });
        }
      }

      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.ghiNhatKyLoi(command, error);
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống đang bảo trì, không thể gửi phản hồi lúc này");
    }
  }

  private async ghiNhatKyLoi(command: LenhGuiPhanHoiNguoiDungHienTai, error: unknown) {
    try {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "ERROR",
        action: "USER_FEEDBACK_SUBMITTED_FAILED",
        tableName: "nhat_ky_he_thong",
        message: "Lỗi gửi phản hồi người dùng",
        metadata: {
          category: command.category,
          hasAttachment: Boolean(command.tep),
          errorName: layTenLoi(error)
        }
      });
    } catch (auditError) {
      nhatKy.error("Không thể ghi log lỗi gửi phản hồi", {
        error: auditError,
        originalErrorName: layTenLoi(error)
      });
    }
  }
}