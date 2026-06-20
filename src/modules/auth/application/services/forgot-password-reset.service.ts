import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const THOI_HAN_MA_QUEN_MAT_KHAU_MS = 10 * 60 * 1000;
export const THOI_HAN_TOKEN_DAT_LAI_MAT_KHAU_MS = 10 * 60 * 1000;
export const SO_LAN_NHAP_SAI_MA_QUEN_MAT_KHAU_TOI_DA = 5;

const chuanHoaEmail = (email: string) => email.trim().toLowerCase();

const bamSha256 = (giaTri: string) => createHash("sha256").update(giaTri).digest("hex");

export const taoMaQuenMatKhau = () => randomInt(0, 1_000_000).toString().padStart(6, "0");

export const taoTokenDatLaiMatKhau = () => randomBytes(32).toString("base64url");

export const bamMaQuenMatKhau = (email: string, code: string) =>
  bamSha256(`${chuanHoaEmail(email)}:${code}`);

export const bamTokenDatLaiMatKhau = (token: string) => bamSha256(token);

export const tinhThoiGianHetHan = (thoiHanMs: number, now = new Date()) =>
  new Date(now.getTime() + thoiHanMs);

export const hashBangNhauBaoMat = (hashA: string | null | undefined, hashB: string) => {
  if (!hashA) {
    return false;
  }

  const bufferA = Buffer.from(hashA, "hex");
  const bufferB = Buffer.from(hashB, "hex");

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
};
