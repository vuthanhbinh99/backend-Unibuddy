import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  BoLocGhiChu,
  DuLieuCapNhatGhiChu,
  DuLieuTaoGhiChu,
  DuLieuTaoTepDinhKemGhiChu,
  KhoGhiChu
} from "../application/ports/note.repository.js";
import type { GhiChu, GhiChuDanhSach, SapXepGhiChu, TepDinhKemGhiChu } from "../domain/notes.js";

type DongGhiChu = {
  maGhiChu: string;
  maNguoiDung: string;
  maMonHoc: string | null;
  tieuDe: string;
  noiDung: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DongGhiChuDanhSach = DongGhiChu & {
  soTepDinhKem: string | number;
};

type DongTepDinhKem = {
  maTaiLieu: string;
  maGhiChu: string;
  nguoiTaiLen: string;
  duongDanLuuTru: string;
  tenFile: string;
  loaiFile: string | null;
  dungLuong: string | number | null;
  createdAt: Date;
  updatedAt: Date;
};

type KetQuaDem = {
  total: string | number;
};

const anhXaGhiChu = (row: DongGhiChu): GhiChu => ({
  maGhiChu: row.maGhiChu,
  maNguoiDung: row.maNguoiDung,
  maMonHoc: row.maMonHoc,
  tieuDe: row.tieuDe,
  noiDung: row.noiDung,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const anhXaGhiChuDanhSach = (row: DongGhiChuDanhSach): GhiChuDanhSach => ({
  ...anhXaGhiChu(row),
  soTepDinhKem: Number(row.soTepDinhKem)
});

const anhXaTepDinhKem = (row: DongTepDinhKem): TepDinhKemGhiChu => ({
  maTaiLieu: row.maTaiLieu,
  maGhiChu: row.maGhiChu,
  nguoiTaiLen: row.nguoiTaiLen,
  duongDanLuuTru: row.duongDanLuuTru,
  tenFile: row.tenFile,
  loaiFile: row.loaiFile,
  dungLuong: row.dungLuong === null ? null : Number(row.dungLuong),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const cauTruyVanGhiChuCoSo = `
  SELECT
    gc.ma_ghi_chu AS "maGhiChu",
    gc.ma_nguoi_dung AS "maNguoiDung",
    gc.ma_mon_hoc AS "maMonHoc",
    gc.tieu_de AS "tieuDe",
    gc.noi_dung AS "noiDung",
    gc.thoi_gian_tao AS "createdAt",
    gc.thoi_gian_cap_nhat AS "updatedAt"
  FROM ghi_chu gc
`;

const cauTruyVanTepDinhKemCoSo = `
  SELECT
    tl.ma_tai_lieu AS "maTaiLieu",
    tl.ma_ghi_chu AS "maGhiChu",
    tl.nguoi_tai_len AS "nguoiTaiLen",
    tl.duong_dan_luu_tru AS "duongDanLuuTru",
    tl.ten_file AS "tenFile",
    tl.loai_file AS "loaiFile",
    tl.dung_luong AS "dungLuong",
    tl.thoi_gian_tao AS "createdAt",
    tl.thoi_gian_cap_nhat AS "updatedAt"
  FROM tai_lieu tl
`;

const laySapXep = (sort: SapXepGhiChu) => {
  switch (sort) {
    case "updated_asc":
      return "gc.thoi_gian_cap_nhat ASC, gc.thoi_gian_tao ASC";
    case "created_desc":
      return "gc.thoi_gian_tao DESC";
    case "created_asc":
      return "gc.thoi_gian_tao ASC";
    case "title_asc":
      return "LOWER(gc.tieu_de) ASC, gc.thoi_gian_cap_nhat DESC";
    case "title_desc":
      return "LOWER(gc.tieu_de) DESC, gc.thoi_gian_cap_nhat DESC";
    case "updated_desc":
    default:
      return "gc.thoi_gian_cap_nhat DESC, gc.thoi_gian_tao DESC";
  }
};

const taoDieuKienLoc = (boLoc: BoLocGhiChu) => {
  const dieuKien = ["gc.ma_nguoi_dung = $1"];
  const thamSo: unknown[] = [boLoc.maNguoiDung];

  if (boLoc.tuKhoa) {
    thamSo.push(`%${boLoc.tuKhoa}%`);
    dieuKien.push(`(gc.tieu_de ILIKE $${thamSo.length} OR COALESCE(gc.noi_dung, '') ILIKE $${thamSo.length})`);
  }

  if (boLoc.maMonHoc) {
    thamSo.push(boLoc.maMonHoc);
    dieuKien.push(`gc.ma_mon_hoc = $${thamSo.length}`);
  }

  return {
    whereSql: `WHERE ${dieuKien.join(" AND ")}`,
    thamSo
  };
};

export class KhoGhiChuPostgres implements KhoGhiChu {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async lietKe(boLoc: BoLocGhiChu, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const { whereSql, thamSo } = taoDieuKienLoc(boLoc);
    const offset = (boLoc.page - 1) * boLoc.limit;
    const orderSql = laySapXep(boLoc.sort);

    const ketQua = await boThucThi.truyVan<DongGhiChuDanhSach>(
      `
        SELECT
          gc.ma_ghi_chu AS "maGhiChu",
          gc.ma_nguoi_dung AS "maNguoiDung",
          gc.ma_mon_hoc AS "maMonHoc",
          gc.tieu_de AS "tieuDe",
          gc.noi_dung AS "noiDung",
          gc.thoi_gian_tao AS "createdAt",
          gc.thoi_gian_cap_nhat AS "updatedAt",
          COUNT(tl.ma_tai_lieu)::int AS "soTepDinhKem"
        FROM ghi_chu gc
        LEFT JOIN tai_lieu tl
          ON tl.ma_ghi_chu = gc.ma_ghi_chu
         AND tl.trang_thai = 'KHA_DUNG'
        ${whereSql}
        GROUP BY gc.ma_ghi_chu
        ORDER BY ${orderSql}
        LIMIT $${thamSo.length + 1}
        OFFSET $${thamSo.length + 2}
      `,
      [...thamSo, boLoc.limit, offset]
    );

    const dem = await boThucThi.truyVan<KetQuaDem>(
      `
        SELECT COUNT(*)::int AS "total"
        FROM ghi_chu gc
        ${whereSql}
      `,
      thamSo
    );

    return {
      items: ketQua.rows.map(anhXaGhiChuDanhSach),
      total: Number(dem.rows[0]?.total ?? 0),
      page: boLoc.page,
      limit: boLoc.limit
    };
  }

  async timTheoMa(maGhiChu: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongGhiChu>(
      `
        ${cauTruyVanGhiChuCoSo}
        WHERE gc.ma_ghi_chu = $1
        LIMIT 1
      `,
      [maGhiChu]
    );

    const ghiChu = ketQua.rows[0];

    if (!ghiChu) {
      return null;
    }

    return {
      ...anhXaGhiChu(ghiChu),
      tepDinhKem: await this.lietKeTepDinhKem(maGhiChu, boThucThi)
    };
  }

  async tao(data: DuLieuTaoGhiChu, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongGhiChu>(
      `
        INSERT INTO ghi_chu (
          ma_nguoi_dung,
          ma_mon_hoc,
          tieu_de,
          noi_dung,
          thoi_gian_tao,
          thoi_gian_cap_nhat
        )
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING
          ma_ghi_chu AS "maGhiChu",
          ma_nguoi_dung AS "maNguoiDung",
          ma_mon_hoc AS "maMonHoc",
          tieu_de AS "tieuDe",
          noi_dung AS "noiDung",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt"
      `,
      [data.maNguoiDung, data.maMonHoc, data.tieuDe, data.noiDung]
    );

    const ghiChu = ketQua.rows[0];

    if (!ghiChu) {
      throw new Error("Tao ghi chu that bai");
    }

    return anhXaGhiChu(ghiChu);
  }

  async capNhat(data: DuLieuCapNhatGhiChu, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongGhiChu>(
      `
        UPDATE ghi_chu
        SET ma_mon_hoc = $2,
            tieu_de = $3,
            noi_dung = $4,
            thoi_gian_cap_nhat = NOW()
        WHERE ma_ghi_chu = $1
        RETURNING
          ma_ghi_chu AS "maGhiChu",
          ma_nguoi_dung AS "maNguoiDung",
          ma_mon_hoc AS "maMonHoc",
          tieu_de AS "tieuDe",
          noi_dung AS "noiDung",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt"
      `,
      [data.maGhiChu, data.maMonHoc, data.tieuDe, data.noiDung]
    );

    return ketQua.rows[0] ? anhXaGhiChu(ketQua.rows[0]) : null;
  }

  async xoaTheoMa(maGhiChu: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan(`DELETE FROM ghi_chu WHERE ma_ghi_chu = $1`, [maGhiChu]);

    return (ketQua.rowCount ?? 0) > 0;
  }

  async taoTepDinhKem(data: DuLieuTaoTepDinhKemGhiChu, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongTepDinhKem>(
      `
        INSERT INTO tai_lieu (
          nguoi_tai_len,
          ma_ghi_chu,
          duong_dan_luu_tru,
          ten_file,
          loai_file,
          dung_luong,
          che_do_hien_thi,
          trang_thai,
          thoi_gian_tao,
          thoi_gian_cap_nhat
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'RIENG_TU', 'KHA_DUNG', NOW(), NOW())
        RETURNING
          ma_tai_lieu AS "maTaiLieu",
          ma_ghi_chu AS "maGhiChu",
          nguoi_tai_len AS "nguoiTaiLen",
          duong_dan_luu_tru AS "duongDanLuuTru",
          ten_file AS "tenFile",
          loai_file AS "loaiFile",
          dung_luong AS "dungLuong",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt"
      `,
      [
        data.nguoiTaiLen,
        data.maGhiChu,
        data.duongDanLuuTru,
        data.tenFile,
        data.loaiFile,
        data.dungLuong
      ]
    );

    const tepDinhKem = ketQua.rows[0];

    if (!tepDinhKem) {
      throw new Error("Tao tep dinh kem ghi chu that bai");
    }

    return anhXaTepDinhKem(tepDinhKem);
  }

  async kiemTraDuongDanTaiLieuDaTonTai(
    duongDanLuuTru: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM tai_lieu tl
          WHERE tl.duong_dan_luu_tru = $1
        ) AS "exists"
      `,
      [duongDanLuuTru]
    );

    return ketQua.rows[0]?.exists ?? false;
  }

  async danhDauXoaTepDinhKemTheoMaGhiChu(
    maGhiChu: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan(
      `
        UPDATE tai_lieu
        SET trang_thai = 'DA_XOA',
            thoi_gian_cap_nhat = NOW()
        WHERE ma_ghi_chu = $1
          AND nguoi_tai_len = $2
          AND trang_thai = 'KHA_DUNG'
      `,
      [maGhiChu, maNguoiDung]
    );

    return ketQua.rowCount ?? 0;
  }

  async danhDauXoaTepDinhKemTheoDanhSach(
    maGhiChu: string,
    maNguoiDung: string,
    maTaiLieu: string[],
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    if (maTaiLieu.length === 0) {
      return 0;
    }

    const ketQua = await boThucThi.truyVan(
      `
        UPDATE tai_lieu
        SET trang_thai = 'DA_XOA',
            thoi_gian_cap_nhat = NOW()
        WHERE ma_ghi_chu = $1
          AND nguoi_tai_len = $2
          AND ma_tai_lieu = ANY($3::uuid[])
          AND trang_thai = 'KHA_DUNG'
      `,
      [maGhiChu, maNguoiDung, maTaiLieu]
    );

    return ketQua.rowCount ?? 0;
  }

  async kiemTraMonHocThuocSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM mon_hoc mh
          INNER JOIN hoc_ky hk ON hk.ma_hoc_ky = mh.ma_hoc_ky
          WHERE mh.ma_mon_hoc = $1
            AND hk.ma_nguoi_dung = $2
        ) AS "exists"
      `,
      [maMonHoc, maNguoiDung]
    );

    return ketQua.rows[0]?.exists ?? false;
  }

  private async lietKeTepDinhKem(maGhiChu: string, boThucThi: BoThucThiTruyVan) {
    const ketQua = await boThucThi.truyVan<DongTepDinhKem>(
      `
        ${cauTruyVanTepDinhKemCoSo}
        WHERE tl.ma_ghi_chu = $1
          AND tl.trang_thai = 'KHA_DUNG'
        ORDER BY tl.thoi_gian_tao ASC
      `,
      [maGhiChu]
    );

    return ketQua.rows.map(anhXaTepDinhKem);
  }
}
