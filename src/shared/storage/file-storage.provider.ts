export type ThuMucLuuTruTep = "avatars" | "documents" | "videos" | "attachments";

export type LenhTaiTepLenCloud = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  ownerId: string;
  folder: ThuMucLuuTruTep;
};

export type TepDaLuuTru = {
  storagePath: string;
  publicUrl: string;
  provider: "cloudinary";
  mimeType: string;
  size: number;
  resourceType: string;
  publicId: string;
};

export interface DichVuLuuTruTep {
  taiLen(command: LenhTaiTepLenCloud): Promise<TepDaLuuTru>;
  xoa(storagePath: string): Promise<void>;
}
