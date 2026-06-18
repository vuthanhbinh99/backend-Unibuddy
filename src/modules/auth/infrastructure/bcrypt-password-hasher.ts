import bcrypt from "bcryptjs";
import type { BoMaHoaMatKhau } from "../application/ports/password-hasher.js";

export class BoMaHoaMatKhauBcrypt implements BoMaHoaMatKhau {
  soSanh(plainText: string, bam: string) {
    return bcrypt.compare(plainText, bam);
  }

  bam(plainText: string) {
    return bcrypt.hash(plainText, 12);
  }
}



