import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import type { DichVuLuuTruTep, LenhTaiTepLenCloud, TepDaLuuTru } from "./file-storage.provider.js";

export type CauHinhCloudinary = {
  cloudName: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  folderPrefix: string;
};

type CloudinaryUploadResponse = {
  secure_url?: unknown;
  url?: unknown;
  public_id?: unknown;
  resource_type?: unknown;
  bytes?: unknown;
};

const loaiTaiNguyenCloudinary = (mimeType: string) => {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "raw";
};

const taoChuKy = (params: Record<string, string>, apiSecret: string) => {
  const payload = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
};

const taoFormDataDaKy = (params: Record<string, string>, apiKey: string, apiSecret: string) => {
  const formData = new FormData();
  const signature = taoChuKy(params, apiSecret);

  for (const [key, value] of Object.entries(params)) {
    formData.append(key, value);
  }

  formData.append("api_key", apiKey);
  formData.append("signature", signature);

  return formData;
};

const taoPublicId = (ownerId: string, originalName: string, resourceType: string) => {
  const extension = extname(originalName).toLowerCase();
  const rawExtension = resourceType === "raw" && extension ? extension : "";
  return `${ownerId}/${randomUUID()}${rawExtension}`;
};

const docJson = async (response: Response): Promise<CloudinaryUploadResponse> => {
  const data = (await response.json()) as CloudinaryUploadResponse;
  return data;
};

export class DichVuLuuTruTepCloudinary implements DichVuLuuTruTep {
  constructor(private readonly cauHinh: CauHinhCloudinary) {}

  async taiLen(command: LenhTaiTepLenCloud): Promise<TepDaLuuTru> {
    const { cloudName, apiKey, apiSecret } = this.cauHinh;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary is not configured");
    }

    const resourceType = loaiTaiNguyenCloudinary(command.mimeType);
    const folder = `${this.cauHinh.folderPrefix}/${command.folder}`;
    const publicId = taoPublicId(command.ownerId, command.originalName, resourceType);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params = { folder, public_id: publicId, timestamp };
    const formData = taoFormDataDaKy(params, apiKey, apiSecret);
    const blob = new Blob([new Uint8Array(command.buffer)], { type: command.mimeType });
    formData.append("file", blob, command.originalName);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed with status ${response.status}`);
    }

    const data = await docJson(response);
    const publicUrl = typeof data.secure_url === "string" ? data.secure_url : data.url;
    const cloudPublicId = typeof data.public_id === "string" ? data.public_id : null;
    const cloudResourceType = typeof data.resource_type === "string" ? data.resource_type : resourceType;

    if (typeof publicUrl !== "string" || !cloudPublicId) {
      throw new Error("Cloudinary upload response is invalid");
    }

    return {
      storagePath: `${cloudResourceType}/${cloudPublicId}`,
      publicUrl,
      provider: "cloudinary",
      mimeType: command.mimeType,
      size: typeof data.bytes === "number" ? data.bytes : command.size,
      resourceType: cloudResourceType,
      publicId: cloudPublicId
    };
  }

  async xoa(storagePath: string): Promise<void> {
    const { cloudName, apiKey, apiSecret } = this.cauHinh;

    if (!cloudName || !apiKey || !apiSecret) {
      return;
    }

    const [resourceType, ...publicIdParts] = storagePath.split("/");
    const publicId = publicIdParts.join("/");

    if (!resourceType || !publicId) {
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params = { public_id: publicId, timestamp };
    const formData = taoFormDataDaKy(params, apiKey, apiSecret);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Cloudinary delete failed with status ${response.status}`);
    }
  }
}
