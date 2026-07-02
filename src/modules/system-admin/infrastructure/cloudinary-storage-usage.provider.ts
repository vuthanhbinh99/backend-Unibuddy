import type { CauHinhCloudinary } from "../../../shared/storage/cloudinary-file-storage.provider.js";
import type { DichVuDungLuongFirebase } from "../application/ports/firebase-storage-usage.provider.js";
import type { DungLuongTheoDanhMuc, ThongKeDungLuongFirebase } from "../domain/storage-usage.js";

type CloudinaryResource = {
  bytes?: unknown;
};

type CloudinaryResourceListResponse = {
  resources?: unknown;
  next_cursor?: unknown;
};

const CAC_LOAI_TAI_NGUYEN = ["image", "video", "raw"] as const;

const phanLoaiTep = (resourceType: string) => {
  if (resourceType === "image") {
    return "HINH_ANH";
  }

  if (resourceType === "video") {
    return "VIDEO";
  }

  if (resourceType === "raw") {
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

const layDanhSachTaiNguyen = async (
  cauHinh: CauHinhCloudinary,
  resourceType: string,
  nextCursor?: string
): Promise<CloudinaryResourceListResponse> => {
  const auth = Buffer.from(`${cauHinh.apiKey}:${cauHinh.apiSecret}`).toString("base64");
  const query = new URLSearchParams({ max_results: "500" });

  if (nextCursor) {
    query.set("next_cursor", nextCursor);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cauHinh.cloudName}/resources/${resourceType}?${query.toString()}`,
    {
      headers: {
        Authorization: `Basic ${auth}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Yêu cầu tài nguyên Cloudinary thất bại với trạng thái ${response.status}`);
  }

  return (await response.json()) as CloudinaryResourceListResponse;
};

export class DichVuDungLuongCloudinaryStorage implements DichVuDungLuongFirebase {
  constructor(private readonly cauHinhCloudinary: CauHinhCloudinary) {}

  async layThongKeDungLuong(): Promise<ThongKeDungLuongFirebase> {
    if (!this.cauHinhCloudinary.cloudName || !this.cauHinhCloudinary.apiKey || !this.cauHinhCloudinary.apiSecret) {
      return {
        configured: false,
        bucket: this.cauHinhCloudinary.cloudName,
        totalBytes: 0,
        fileCount: 0,
        categories: []
      };
    }

    const categories = new Map<string, DungLuongTheoDanhMuc>();
    let totalBytes = 0;
    let fileCount = 0;

    for (const resourceType of CAC_LOAI_TAI_NGUYEN) {
      let nextCursor: string | undefined;

      do {
        const data = await layDanhSachTaiNguyen(this.cauHinhCloudinary, resourceType, nextCursor);
        const resources = Array.isArray(data.resources) ? (data.resources as CloudinaryResource[]) : [];

        for (const resource of resources) {
          const bytes = typeof resource.bytes === "number" ? resource.bytes : 0;
          totalBytes += bytes;
          fileCount += 1;
          congDonDanhMuc(categories, phanLoaiTep(resourceType), bytes);
        }

        nextCursor = typeof data.next_cursor === "string" ? data.next_cursor : undefined;
      } while (nextCursor);
    }

    return {
      configured: true,
      bucket: this.cauHinhCloudinary.cloudName,
      totalBytes,
      fileCount,
      categories: [...categories.values()].sort((a, b) => b.bytes - a.bytes)
    };
  }
}
