import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { DichVuDungLuongFirebase } from "../ports/firebase-storage-usage.provider.js";
import type { KhoDungLuongHeThong } from "../ports/storage-usage.repository.js";
import type { ThongKeDungLuongFirebase, ThongKeDungLuongHeThong } from "../../domain/storage-usage.js";

type PhuThuoc = {
  khoDungLuongHeThong: KhoDungLuongHeThong;
  dichVuDungLuongFirebase: DichVuDungLuongFirebase;
  khoNhatKyHeThong: KhoNhatKyHeThong;
};

export class XuLyXemDungLuongLuuTru {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(actorId: string): Promise<ThongKeDungLuongHeThong> {
    const noiBo = await this.deps.khoDungLuongHeThong.layThongKeNoiBo();
    let cloudStorage: ThongKeDungLuongFirebase;

    try {
      cloudStorage = await this.deps.dichVuDungLuongFirebase.layThongKeDungLuong();
    } catch (error) {
      cloudStorage = {
        configured: true,
        bucket: null,
        totalBytes: 0,
        fileCount: 0,
        categories: [],
        error: "CLOUDINARY_STORAGE_UNAVAILABLE"
      };

      await this.deps.khoNhatKyHeThong.tao({
        actorId,
        level: "ERROR",
        action: "SYSTEM_STORAGE_USAGE_CLOUDINARY_FAILED",
        message: "Lấy thông tin dung lượng lưu trữ Cloudinary thất bại",
        metadata: {
          errorName: error instanceof Error ? error.name : "UnknownError"
        }
      });
    }

    await this.deps.khoNhatKyHeThong.tao({
      actorId,
      level: "INFO",
      action: "SYSTEM_STORAGE_USAGE_VIEWED",
      message: "Quản trị viên xem dung lượng lưu trữ hệ thống",
      metadata: {
        databaseBytes: noiBo.database.totalBytes,
        documentBytes: noiBo.documents.totalBytes,
        cloudinaryConfigured: cloudStorage.configured,
        cloudinaryBytes: cloudStorage.totalBytes
      }
    });

    return {
      ...noiBo,
      firebase: cloudStorage
    };
  }
}
