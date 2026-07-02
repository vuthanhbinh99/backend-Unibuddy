import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import { nhatKy } from "../../../../shared/logger/logger.js";
import type { DichVuLuuTruTep, TepDaLuuTru } from "../../../../shared/storage/file-storage.provider.js";
import { anhXaNguoiDungCongKhai } from "../../domain/user.js";
import type { KhoNguoiDung } from "../ports/user.repository.js";

type TepAvatar = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
};

export type LenhCapNhatAnhDaiDienCuaToi = {
  actorId: string;
  tep: TepAvatar;
};

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuLuuTruTep: DichVuLuuTruTep;
};

const layTenLoi = (error: unknown) => (error instanceof Error ? error.name : typeof error);

export class XuLyCapNhatAnhDaiDienCuaToi {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatAnhDaiDienCuaToi) {
    let tepDaLuu: TepDaLuuTru | null = null;

    try {
      tepDaLuu = await this.deps.dichVuLuuTruTep.taiLen({
        buffer: command.tep.buffer,
        originalName: command.tep.originalName,
        mimeType: command.tep.mimeType,
        size: command.tep.size,
        ownerId: command.actorId,
        folder: "avatars"
      });
      const tepCloud = tepDaLuu;

      const user = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const capNhat = await this.deps.khoNguoiDung.capNhatAnhDaiDien(
          {
            userId: command.actorId,
            avatarUrl: tepCloud.publicUrl
          },
          tx
        );

        if (!capNhat) {
          throw LoiUngDung.khongTimThay("Không tìm thấy người dùng");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "USER_AVATAR_UPDATED",
            tableName: "nguoi_dung",
            recordId: command.actorId,
            message: "Người dùng cập nhật ảnh đại diện thành công",
            metadata: {
              storageProvider: tepCloud.provider,
              loaiFile: command.tep.mimeType,
              dungLuong: tepCloud.size
            }
          },
          tx
        );

        return capNhat;
      });

      return {
        message: "Cập nhật ảnh đại diện thành công",
        user: anhXaNguoiDungCongKhai(user)
      };
    } catch (error) {
      await this.xoaTepCloudSauLoiNeuCo(tepDaLuu);

      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.ghiNhatKyLoi(command, error);
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống đang bảo trì, không thể cập nhật ảnh đại diện lúc này");
    }
  }

  private async xoaTepCloudSauLoiNeuCo(tepDaLuu: TepDaLuuTru | null) {
    if (!tepDaLuu) {
      return;
    }

    try {
      await this.deps.dichVuLuuTruTep.xoa(tepDaLuu.storagePath);
    } catch (cleanupError) {
      nhatKy.error("Không thể xóa avatar Cloudinary sau khi cập nhật DB thất bại", {
        error: cleanupError,
        storagePath: tepDaLuu.storagePath
      });
    }
  }

  private async ghiNhatKyLoi(command: LenhCapNhatAnhDaiDienCuaToi, error: unknown) {
    try {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "ERROR",
        action: "USER_AVATAR_UPDATE_FAILED",
        tableName: "nguoi_dung",
        recordId: command.actorId,
        message: "Lỗi cập nhật ảnh đại diện người dùng",
        metadata: {
          loaiFile: command.tep.mimeType,
          dungLuong: command.tep.size,
          errorName: layTenLoi(error)
        }
      });
    } catch (auditError) {
      nhatKy.error("Không thể ghi log lỗi cập nhật avatar", {
        error: auditError,
        originalErrorName: layTenLoi(error)
      });
    }
  }
}
