import { watch } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type MoTaTuyenDuong = {
  method: string;
  path: string;
  tag: string;
  summary: string;
  publicRoute: boolean;
};

const thuMucModule = path.dirname(fileURLToPath(import.meta.url));
const thuMucBackend = path.resolve(thuMucModule, "../../../");
const tepOpenApi = path.join(thuMucBackend, "openapi.yaml");
const tepRoutesGoc = path.join(thuMucBackend, "src/routes.ts");
const thuMucNguon = path.join(thuMucBackend, "src");

const bieuThucImportRoutes = /^import\s+\{\s*([^}]+)\s*\}\s+from\s+"(.+?\.js)";$/gm;
const bieuThucTuyenDuong = /router\.(get|post|put|delete|patch|head|options)\(\s*"([^"]+)"\s*,/gm;
const bieuThucRouterUseBoPhuThuoc = /router\.use\(\s*"([^"]+)"\s*,\s*([A-Za-z0-9_]+)\(boPhuThuoc\)\s*\);/gm;

let dangDongBo = false;
let boQuanSat: ReturnType<typeof watch> | null = null;

function catDuongDan(phanA: string, phanB: string) {
  const hopLeA = phanA.replace(/^\/+|\/+$/g, "");
  const hopLeB = phanB.replace(/^\/+|\/+$/g, "");

  if (!hopLeA) {
    return `/${hopLeB}`.replace(/\/+$/, "") || "/";
  }

  if (!hopLeB) {
    return `/${hopLeA}`.replace(/\/+$/, "") || "/";
  }

  return `/${[hopLeA, hopLeB].join("/")}`.replace(/\/+$/, "") || "/";
}

function doiExpressSangOpenApi(duongDan: string) {
  return duongDan.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function layTag(duongDan: string) {
  if (duongDan.startsWith("/health")) {
    return "Health";
  }

  if (duongDan.startsWith("/auth")) {
    return "Auth";
  }

  if (duongDan.startsWith("/users")) {
    return "Users";
  }

  if (duongDan.startsWith("/admin/users")) {
    return "Admin Users";
  }

  if (duongDan.startsWith("/student/documents")) {
    return "Student Documents";
  }

  if (duongDan.startsWith("/notes")) {
    return "Student Notes";
  }

  if (duongDan.startsWith("/attachments")) {
    return "Student Note Attachments";
  }

  if (duongDan.startsWith("/admin/reports")) {
    return "Admin Reports";
  }

  if (duongDan.startsWith("/admin/system-notifications")) {
    return "Quan Tri Vien Notifications";
  }

  if (
    duongDan.startsWith("/admin/storage-usage") ||
    duongDan.startsWith("/admin/audit-logs") ||
    duongDan.startsWith("/admin/error-logs")
  ) {
    return "Quan Tri Vien System";
  }

  if (duongDan.startsWith("/admin/schools") && duongDan.includes("/academic-rules")) {
    return "Academic Rules";
  }

  if (duongDan.startsWith("/admin/schools")) {
    return "Admin Schools";
  }

  return "API";
}

function layMoTa(duongDan: string, method: string) {
  const phuongThuc = method.toUpperCase();

  if (duongDan === "/health") {
    return "Health check";
  }

  if (duongDan === "/auth/login") {
    return "Login with email and password";
  }

  if (duongDan === "/auth/google") {
    return "Login with Google ID token";
  }

  if (duongDan === "/auth/refresh") {
    return "Refresh access token";
  }

  if (duongDan === "/auth/logout") {
    return "Logout current session";
  }

  if (duongDan === "/auth/forgot-password") {
    return "Request forgot password code";
  }

  if (duongDan === "/auth/forgot-password/verify") {
    return "Verify forgot password code";
  }

  if (duongDan === "/auth/forgot-password/reset") {
    return "Reset password with token";
  }

  if (duongDan === "/users/me") {
    return "Current user profile";
  }

  if (duongDan === "/student/documents") {
    return "Upload shared document";
  }

  if (duongDan === "/notes") {
    return method === "get" ? "List, search, and filter student notes" : "Create student note";
  }

  if (duongDan === "/notes/{maGhiChu}") {
    if (method === "get") {
      return "Get student note detail";
    }

    if (method === "put") {
      return "Update student note";
    }

    if (method === "delete") {
      return "Delete student note";
    }
  }

  if (duongDan === "/attachments") {
    return "Attach document to student note";
  }

  if (duongDan === "/auth/doi-mat-khau-dau") {
    return "First password change";
  }

  if (duongDan === "/admin/users") {
    return method === "get" ? "List users" : "Create admin user";
  }

  if (duongDan.endsWith("/role") && duongDan.startsWith("/admin/users/")) {
    return "Update user role";
  }

  if (duongDan.endsWith("/status") && duongDan.startsWith("/admin/users/")) {
    return "Update user status";
  }

  if (duongDan === "/admin/schools") {
    return method === "get" ? "List schools" : "Create school";
  }

  if (duongDan === "/admin/reports") {
    return "List report documents";
  }

  if (duongDan.endsWith("/approve")) {
    return "Approve report document";
  }

  if (duongDan.endsWith("/reject")) {
    return "Reject report document";
  }

  if (duongDan === "/admin/system-notifications") {
    return "Send system notification";
  }

  if (duongDan === "/admin/storage-usage") {
    return "Get storage usage";
  }

  if (duongDan === "/admin/audit-logs") {
    return "List system audit logs";
  }

  if (duongDan === "/admin/error-logs") {
    return "List system error logs";
  }

  if (duongDan === "/admin/error-logs/{logId}") {
    return "Get system error log detail";
  }

  if (duongDan.includes("/academic-rules")) {
    return "Academic rules configuration";
  }

  if (method === "get") {
    return `Get ${duongDan}`;
  }

  return `${phuongThuc} ${duongDan}`;
}

function laCongKhai(duongDan: string) {
  return duongDan.startsWith("/health") || duongDan.startsWith("/auth");
}

function layThongBaoPhanHoi(duongDan: string) {
  if (duongDan === "/health") {
    return "Service status";
  }

  return "Success";
}

function layMaTrangThai(duongDan: string, method: string) {
  if (duongDan === "/auth/refresh") {
    return "201";
  }

  if (duongDan === "/admin/users" && method === "post") {
    return "201";
  }

  if (duongDan === "/admin/schools" && method === "post") {
    return "201";
  }

  if (duongDan === "/student/documents" && method === "post") {
    return "201";
  }

  if (duongDan === "/notes" && method === "post") {
    return "201";
  }

  if (duongDan === "/attachments" && method === "post") {
    return "201";
  }

  return "200";
}

function taoParameterSchema(tenThamSo: string) {
  if (tenThamSo === "maTruongCode") {
    return [
      "        - $ref: '#/components/parameters/MaTruongCode'"
    ].join("\n");
  }

  return [
    "        - name: " + tenThamSo,
    "          in: path",
    "          required: true",
    "          schema:",
    "            type: string"
  ].join("\n");
}

function taoDoiDuongDan(duongDan: string) {
  return Array.from(duongDan.matchAll(/\{([A-Za-z0-9_]+)\}/g)).map((match) => match[1]);
}

function taoKhoiPhanHoi(duongDan: string, method: string) {
  const khoi: string[] = [];

  khoi.push(`        '${layMaTrangThai(duongDan, method)}':`);
  khoi.push("          description: " + layThongBaoPhanHoi(duongDan));
  khoi.push("          content:");
  khoi.push("            application/json:");
  khoi.push("              schema:");
  khoi.push("                $ref: '#/components/schemas/ApiSuccess'");

  if (!laCongKhai(duongDan)) {
    khoi.push("        '400':");
    khoi.push("          $ref: '#/components/responses/ValidationError'");
    khoi.push("        '401':");
    khoi.push("          $ref: '#/components/responses/UnauthorizedError'");
    khoi.push("        '403':");
    khoi.push("          $ref: '#/components/responses/ForbiddenError'");
  } else if (duongDan.startsWith("/auth")) {
    khoi.push("        '400':");
    khoi.push("          $ref: '#/components/responses/ValidationError'");
    khoi.push("        '401':");
    khoi.push("          $ref: '#/components/responses/UnauthorizedError'");
  }

  return khoi;
}

function taoKhoiPhuongThuc(tuyenDuong: MoTaTuyenDuong) {
  const thamSo = taoDoiDuongDan(tuyenDuong.path);
  const coThamSo = thamSo.length > 0;
  const thamSoYaml = thamSo.map((ten) => taoParameterSchema(ten));

  const dong: string[] = [];
  dong.push(`    ${tuyenDuong.method}:`);

  if (tuyenDuong.publicRoute) {
    dong.push("      security: []");
  }

  dong.push(`      summary: ${tuyenDuong.summary}`);
  dong.push(`      tags: [${tuyenDuong.tag}]`);

  if (coThamSo) {
    dong.push("      parameters:");
    dong.push(...thamSoYaml);
  }

  dong.push("      responses:");
  dong.push(...taoKhoiPhanHoi(tuyenDuong.path, tuyenDuong.method));

  return dong.join("\n");
}

function layViTriMucTieu(phanTPaths: string) {
  const viTriComponents = phanTPaths.indexOf("\ncomponents:");
  return viTriComponents >= 0 ? viTriComponents + 1 : phanTPaths.length;
}

async function layCacMoTaTuyenDuong(tapFile: string, duongDanGoc: string, daTham: Set<string>, ketQua: MoTaTuyenDuong[]) {
  const noiDung = await readFile(tapFile, "utf8");
  const cacImport = new Map<string, string>();

  for (const khop of noiDung.matchAll(bieuThucImportRoutes)) {
    const aliases = khop[1].split(",").map((ten: string) => ten.trim()).filter(Boolean);
    const duongDanNhap = khop[2];

    for (const alias of aliases) {
      cacImport.set(alias, duongDanNhap);
    }
  }

  for (const khop of noiDung.matchAll(bieuThucTuyenDuong)) {
    const method = khop[1].toLowerCase();
    const duongDanCon = khop[2];
    const duongDanDayDu = doiExpressSangOpenApi(catDuongDan(duongDanGoc, duongDanCon));

    ketQua.push({
      method,
      path: duongDanDayDu,
      tag: layTag(duongDanDayDu),
      summary: layMoTa(duongDanDayDu, method),
      publicRoute: laCongKhai(duongDanDayDu)
    });
  }

  for (const khop of noiDung.matchAll(bieuThucRouterUseBoPhuThuoc)) {
    const duongDanCon = khop[1];
    const tenBoXayDung = khop[2];
    const duongDanNhap = cacImport.get(tenBoXayDung);

    if (!duongDanNhap) {
      continue;
    }

    const duongDanTep = path.resolve(path.dirname(tapFile), duongDanNhap.replace(/\.js$/, ".ts"));

    if (daTham.has(duongDanTep)) {
      continue;
    }

    daTham.add(duongDanTep);
    await layCacMoTaTuyenDuong(duongDanTep, catDuongDan(duongDanGoc, duongDanCon), daTham, ketQua);
  }
}

async function taoDanhSachTuyenDuong() {
  const ketQua: MoTaTuyenDuong[] = [];
  const daTham = new Set<string>();

  daTham.add(tepRoutesGoc);
  await layCacMoTaTuyenDuong(tepRoutesGoc, "", daTham, ketQua);

  return ketQua;
}

function layCacTuyenDuongThieu(noiDung: string, dsTuyenDuong: MoTaTuyenDuong[]) {
  const groupByPath = new Map<string, MoTaTuyenDuong[]>();

  for (const tuyenDuong of dsTuyenDuong) {
    const list = groupByPath.get(tuyenDuong.path) ?? [];
    list.push(tuyenDuong);
    groupByPath.set(tuyenDuong.path, list);
  }

  const cacKhoiTuyenDuong: { path: string; content: string; isNewPath: boolean }[] = [];

  for (const [duongDan, dsTheoDuongDan] of groupByPath.entries()) {
    const pathHeader = `  ${duongDan}:`;
    const daTonTaiPath = noiDung.includes(pathHeader);

    if (!daTonTaiPath) {
      cacKhoiTuyenDuong.push({
        path: duongDan,
        content: [`  ${duongDan}:`, ...dsTheoDuongDan.map(taoKhoiPhuongThuc)].join("\n"),
        isNewPath: true
      });
      continue;
    }

    const start = noiDung.indexOf(pathHeader);
    const phanConLai = noiDung.slice(start + pathHeader.length);
    const ketThuc = phanConLai.search(/\n  \//g);
    const ketThucPath = ketThuc >= 0 ? start + pathHeader.length + ketThuc : noiDung.length;
    const phanMuc = noiDung.slice(start, ketThucPath);

    const cacPhanThieu = dsTheoDuongDan
      .filter((tuyenDuong) => !phanMuc.includes(`    ${tuyenDuong.method}:`))
      .map(taoKhoiPhuongThuc);

    if (cacPhanThieu.length > 0) {
      cacKhoiTuyenDuong.push({
        path: duongDan,
        content: cacPhanThieu.join("\n"),
        isNewPath: false
      });
    }
  }

  return cacKhoiTuyenDuong;
}

export async function dongBoOpenApi() {
  const [noiDungOpenApi, dsTuyenDuong] = await Promise.all([
    readFile(tepOpenApi, "utf8"),
    taoDanhSachTuyenDuong()
  ]);

  const phanTieuDe = noiDungOpenApi.split("\ncomponents:")[0];
  const viTriDich = layViTriMucTieu(phanTieuDe);
  const cacTuyenDuongThieu = layCacTuyenDuongThieu(noiDungOpenApi, dsTuyenDuong);

  if (cacTuyenDuongThieu.length === 0) {
    return false;
  }

  const khoiThemMoi = cacTuyenDuongThieu
    .map((item) => item.content)
    .join("\n");

  const noiDungMoi = `${noiDungOpenApi.slice(0, viTriDich)}${khoiThemMoi}\n${noiDungOpenApi.slice(viTriDich)}`;

  await writeFile(tepOpenApi, noiDungMoi, "utf8");
  return true;
}

export function batDauDongBoOpenApi() {
  if (boQuanSat) {
    return () => {
      boQuanSat?.close();
      boQuanSat = null;
    };
  }

  let gioDongBo: NodeJS.Timeout | undefined;

  const kichHoatDongBo = () => {
    if (gioDongBo) {
      clearTimeout(gioDongBo);
    }

    gioDongBo = setTimeout(() => {
      void dongBoOpenApi().catch((loi) => {
        // Keep the API running even if docs sync fails.
        console.error("Failed to sync openapi.yaml", loi);
      });
    }, 200);
  };

  void dongBoOpenApi().catch((loi) => {
    console.error("Failed to sync openapi.yaml", loi);
  });

  boQuanSat = watch(thuMucNguon, { recursive: true }, (_eventType, tenFile) => {
    if (!tenFile) {
      return;
    }

    if (!tenFile.endsWith(".ts")) {
      return;
    }

    kichHoatDongBo();
  });

  return () => {
    if (gioDongBo) {
      clearTimeout(gioDongBo);
    }

    boQuanSat?.close();
    boQuanSat = null;
  };
}
