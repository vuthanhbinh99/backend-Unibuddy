import { getStorage } from "firebase-admin/storage";
import type { CauHinhFirebase } from "../../../shared/firebase/firebase-admin-app.js";
import { layUngDungFirebaseAdmin } from "../../../shared/firebase/firebase-admin-app.js";
import type { DichVuDungLuongFirebase } from "../application/ports/firebase-storage-usage.provider.js";
import type { DungLuongTheoDanhMuc, ThongKeDungLuongFirebase } from "../domain/storage-usage.js";

const phanLoaiTep = (contentType?: string, name?: string) => {
  if (contentType?.startsWith("image/")) {
    return "HINH_ANH";
  }

  if (contentType?.includes("pdf") || contentType?.includes("document") || contentType?.includes("text")) {
    return "TAI_LIEU";
  }

  if (name?.startsWith("avatars/")) {
    return "HINH_ANH";
  }

  if (name?.startsWith("documents/") || name?.startsWith("attachments/")) {
    return "TAI_LIEU";
  }

  return "KHAC";
};

const congDonDanhMuc = (categories: Map<string, DungLuongTheoDanhMuc>, category: string, bytes: number) => {
  const current = categories.get(category) ?? { category, bytes: 0, fileCount: 0 };
  current.bytes += bytes;
  current.fileCount += 1;
  categories.set(category, current);
};

export class DichVuDungLuongFirebaseStorage implements DichVuDungLuongFirebase {
  constructor(private readonly cauHinhFirebase: CauHinhFirebase) {}

  async layThongKeDungLuong(): Promise<ThongKeDungLuongFirebase> {
    const ungDung = layUngDungFirebaseAdmin(this.cauHinhFirebase);

    if (!ungDung || !this.cauHinhFirebase.storageBucket) {
      return {
        configured: false,
        bucket: this.cauHinhFirebase.storageBucket,
        totalBytes: 0,
        fileCount: 0,
        categories: []
      };
    }

    const bucket = getStorage(ungDung).bucket(this.cauHinhFirebase.storageBucket);
    const [files] = await bucket.getFiles();
    const categories = new Map<string, DungLuongTheoDanhMuc>();
    let totalBytes = 0;

    for (const file of files) {
      const bytes = Number(file.metadata.size ?? 0);
      totalBytes += bytes;
      congDonDanhMuc(categories, phanLoaiTep(file.metadata.contentType, file.name), bytes);
    }

    return {
      configured: true,
      bucket: this.cauHinhFirebase.storageBucket,
      totalBytes,
      fileCount: files.length,
      categories: [...categories.values()].sort((a, b) => b.bytes - a.bytes)
    };
  }
}
