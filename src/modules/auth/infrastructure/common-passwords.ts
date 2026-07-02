import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function napDanhSachMatKhauPhoBien(): Set<string> {
  const duongDan = join(__dirname, "data", "common-passwords.txt");
  const noiDung = readFileSync(duongDan, "utf-8");
  return new Set(noiDung.split("\n").map((d) => d.trim()).filter(Boolean));
}

export const DANH_SACH_MAT_KHAU_PHO_BIEN = napDanhSachMatKhauPhoBien();