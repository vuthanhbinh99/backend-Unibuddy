import bcrypt from "bcryptjs";
import type { PasswordHasher } from "../application/ports/password-hasher.js";

export class BcryptPasswordHasher implements PasswordHasher {
  compare(plainText: string, hash: string) {
    return bcrypt.compare(plainText, hash);
  }

  hash(plainText: string) {
    return bcrypt.hash(plainText, 12);
  }
}
