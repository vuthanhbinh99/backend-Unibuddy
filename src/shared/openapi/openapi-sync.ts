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

  if (duongDan.startsWith("/admin/reports")) {
    return "Admin Reports";
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

  if (duongDan === "/users/me") {
    return "Current user profile";
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

  if (duongDan === "/admin/schools" && method === "post") {
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

function taoKhoiPhanHoi(duongDan: string) {
  const khoi: string[] = [];

  khoi.push(`        '${layMaTrangThai(duongDan, "get")}':`);
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

function taoKhoiTuyenDuong(tuyenDuong: MoTaTuyenDuong) {
  const thamSo = taoDoiDuongDan(tuyenDuong.path);
  const coThamSo = thamSo.length > 0;
  const thamSoYaml = thamSo.map((ten) => taoParameterSchema(ten));

  const dong: string[] = [];
  dong.push(`  ${tuyenDuong.path}:`);
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
  dong.push(...taoKhoiPhanHoi(tuyenDuong.path));

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

function taoKhốiTaiLieuChoTuyenDuong(tuyenDuong: MoTaTuyenDuong) {
  return taoKhoiTuyenDuong(tuyenDuong);
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
        content: dsTheoDuongDan.map(taoKhốiTaiLieuChoTuyenDuong).join("\n"),
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
      .map((tuyenDuong) => taoKhốiTaiLieuChoTuyenDuong(tuyenDuong).split("\n").slice(2).join("\n"));

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
