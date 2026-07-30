import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function napDanhSachMatKhauPhoBien(): Set<string> {
  const duongDan = existsSync(join(__dirname, "common-passwords.txt"))
    ? join(__dirname, "common-passwords.txt")
    : join(process.cwd(), "src", "modules", "auth", "infrastructure", "common-passwords.txt");
  const noiDung = readFileSync(duongDan, "utf-8");
  return new Set(noiDung.split("\n").map((d) => d.trim()).filter(Boolean));
}

export const DANH_SACH_MAT_KHAU_PHO_BIEN = napDanhSachMatKhauPhoBien();