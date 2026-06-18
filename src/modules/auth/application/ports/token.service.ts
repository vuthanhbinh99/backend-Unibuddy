import type { NguoiDungXacThuc } from "../../domain/auth-token-payload.js";

export interface DichVuToken {
  kyTokenTruyCap(user: NguoiDungXacThuc): string;
  xacThucTokenTruyCap(token: string): NguoiDungXacThuc;
  taoTokenLamMoi(): string;
  bamTokenLamMoi(token: string): string;
  layThoiGianHetHanTokenLamMoi(): Date;
}



