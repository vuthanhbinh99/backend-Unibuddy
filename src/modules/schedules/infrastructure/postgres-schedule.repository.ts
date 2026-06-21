import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  BoLocLichHoc,
  BoLocMonHocImport,
  KhoLichHoc
} from "../application/ports/schedule.repository.js";
import type {
  DuLieuLichHoc,
  LichHoc,
  MonHocCuaSinhVien,
  NguCanhMonHocTrongLichSinhVien,
  XungDotLichHoc
} from "../domain/schedule.js";

type DongLichHoc = {
  maLichHoc: string;
  maMonHoc: string;
  maHocKy: string;
  maNguoiDung: string;
  maMon: string | null;
  tenMon: string;
  tenHocKy: string;
  thu: number;
  tietBatDau: number;
  soTiet: number;
  phongHoc: string | null;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
};

type DongMonHoc = {
  maMonHoc: string;
  maHocKy: string;
  maMon: string | null;
  tenMon: string;
  tenHocKy: string;
};

type DongNguCanhMonHocTrongLich = {
  maMonHoc: string;
  maMon: string | null;
  tenMon: string;
  maTruong: number | null;
};

const anhXaLichHoc = (row: DongLichHoc): LichHoc => ({
  maLichHoc: row.maLichHoc,
  maMonHoc: row.maMonHoc,
  maHocKy: row.maHocKy,
  maNguoiDung: row.maNguoiDung,
  maMon: row.maMon,
  tenMon: row.tenMon,
  tenHocKy: row.tenHocKy,
  thu: row.thu,
  tietBatDau: row.tietBatDau,
  soTiet: row.soTiet,
  phongHoc: row.phongHoc,
  ngayBatDau: row.ngayBatDau,
  ngayKetThuc: row.ngayKetThuc
});

const anhXaMonHoc = (row: DongMonHoc): MonHocCuaSinhVien => ({
  maMonHoc: row.maMonHoc,
  maHocKy: row.maHocKy,
  maMon: row.maMon,
  tenMon: row.tenMon,
  tenHocKy: row.tenHocKy
});

const anhXaNguCanhMonHocTrongLich = (row: DongNguCanhMonHocTrongLich): NguCanhMonHocTrongLichSinhVien => ({
  maMonHoc: row.maMonHoc,
  maMon: row.maMon,
  tenMon: row.tenMon,
  maTruong: row.maTruong
});

const cauTruyVanLichHocCoSo = `
  SELECT
    lh.ma_lich_hoc AS "maLichHoc",
    lh.ma_mon_hoc AS "maMonHoc",
    mh.ma_hoc_ky AS "maHocKy",
    hk.ma_nguoi_dung AS "maNguoiDung",
    mh.ma_mon AS "maMon",
    mh.ten_mon AS "tenMon",
    hk.ten_hoc_ky AS "tenHocKy",
    lh.thu AS "thu",
    lh.tiet_bat_dau AS "tietBatDau",
    lh.so_tiet AS "soTiet",
    lh.phong_hoc AS "phongHoc",
    lh.ngay_bat_dau::text AS "ngayBatDau",
    lh.ngay_ket_thuc::text AS "ngayKetThuc"
  FROM lich_hoc lh
  INNER JOIN mon_hoc mh ON mh.ma_mon_hoc = lh.ma_mon_hoc
  INNER JOIN hoc_ky hk ON hk.ma_hoc_ky = mh.ma_hoc_ky
`;

const cauTruyVanMonHocCoSo = `
  SELECT
    mh.ma_mon_hoc AS "maMonHoc",
    mh.ma_hoc_ky AS "maHocKy",
    mh.ma_mon AS "maMon",
    mh.ten_mon AS "tenMon",
    hk.ten_hoc_ky AS "tenHocKy"
  FROM mon_hoc mh
  INNER JOIN hoc_ky hk ON hk.ma_hoc_ky = mh.ma_hoc_ky
`;

export class KhoLichHocPostgres implements KhoLichHoc {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async lietKeTheoSinhVien(
    maNguoiDung: string,
    boLoc: BoLocLichHoc = {},
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const thamSo: unknown[] = [maNguoiDung];
    const dieuKien = ["hk.ma_nguoi_dung = $1"];

    if (boLoc.maMonHoc) {
      thamSo.push(boLoc.maMonHoc);
      dieuKien.push(`lh.ma_mon_hoc = $${thamSo.length}`);
    }

    const ketQua = await boThucThi.truyVan<DongLichHoc>(
      `
        ${cauTruyVanLichHocCoSo}
        WHERE ${dieuKien.join(" AND ")}
        ORDER BY lh.thu ASC, lh.tiet_bat_dau ASC, mh.ten_mon ASC
      `,
      thamSo
    );

    return ketQua.rows.map(anhXaLichHoc);
  }

  async timTheoMaCuaSinhVien(
    maLichHoc: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongLichHoc>(
      `
        ${cauTruyVanLichHocCoSo}
        WHERE lh.ma_lich_hoc = $1
          AND hk.ma_nguoi_dung = $2
        LIMIT 1
      `,
      [maLichHoc, maNguoiDung]
    );

    return ketQua.rows[0] ? anhXaLichHoc(ketQua.rows[0]) : null;
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

  async layNguCanhMonHocTrongLichSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongNguCanhMonHocTrongLich>(
      `
        SELECT
          mh.ma_mon_hoc AS "maMonHoc",
          mh.ma_mon AS "maMon",
          mh.ten_mon AS "tenMon",
          hsv.ma_truong AS "maTruong"
        FROM lich_hoc lh
        INNER JOIN mon_hoc mh ON mh.ma_mon_hoc = lh.ma_mon_hoc
        INNER JOIN hoc_ky hk ON hk.ma_hoc_ky = mh.ma_hoc_ky
        INNER JOIN ho_so_sinh_vien hsv ON hsv.ma_nguoi_dung = hk.ma_nguoi_dung
        WHERE lh.ma_mon_hoc = $1
          AND hk.ma_nguoi_dung = $2
        LIMIT 1
      `,
      [maMonHoc, maNguoiDung]
    );

    return ketQua.rows[0] ? anhXaNguCanhMonHocTrongLich(ketQua.rows[0]) : null;
  }

  async timMonHocChoImport(boLoc: BoLocMonHocImport, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    if (!boLoc.maMonHoc && !boLoc.maMon && !boLoc.tenMon) {
      return [];
    }

    const ketQua = await boThucThi.truyVan<DongMonHoc>(
      `
        ${cauTruyVanMonHocCoSo}
        WHERE hk.ma_nguoi_dung = $1
          AND ($2::uuid IS NULL OR mh.ma_hoc_ky = $2)
          AND (
            ($3::uuid IS NOT NULL AND mh.ma_mon_hoc = $3)
            OR ($4::text IS NOT NULL AND mh.ma_mon IS NOT NULL AND LOWER(TRIM(mh.ma_mon)) = LOWER(TRIM($4)))
            OR ($5::text IS NOT NULL AND LOWER(TRIM(mh.ten_mon)) = LOWER(TRIM($5)))
          )
        ORDER BY hk.thoi_gian_tao DESC, mh.ten_mon ASC
      `,
      [
        boLoc.maNguoiDung,
        boLoc.maHocKy ?? null,
        boLoc.maMonHoc ?? null,
        boLoc.maMon ?? null,
        boLoc.tenMon ?? null
      ]
    );

    return ketQua.rows.map(anhXaMonHoc);
  }

  async timXungDot(
    maNguoiDung: string,
    data: DuLieuLichHoc,
    loaiTruMaLichHoc: string | null = null,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongLichHoc>(
      `
        ${cauTruyVanLichHocCoSo}
        WHERE hk.ma_nguoi_dung = $1
          AND lh.thu = $2
          AND ($7::uuid IS NULL OR lh.ma_lich_hoc <> $7)
          AND lh.tiet_bat_dau <= ($3 + $4 - 1)
          AND (lh.tiet_bat_dau + lh.so_tiet - 1) >= $3
          AND ($5::date IS NULL OR lh.ngay_ket_thuc IS NULL OR $5::date <= lh.ngay_ket_thuc)
          AND (lh.ngay_bat_dau IS NULL OR $6::date IS NULL OR lh.ngay_bat_dau <= $6::date)
        ORDER BY lh.thu ASC, lh.tiet_bat_dau ASC
      `,
      [
        maNguoiDung,
        data.thu,
        data.tietBatDau,
        data.soTiet,
        data.ngayBatDau,
        data.ngayKetThuc,
        loaiTruMaLichHoc
      ]
    );

    return ketQua.rows.map(anhXaLichHoc) satisfies XungDotLichHoc[];
  }

  async tao(data: DuLieuLichHoc, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongLichHoc>(
      `
        WITH inserted AS (
          INSERT INTO lich_hoc (
            ma_mon_hoc,
            thu,
            tiet_bat_dau,
            so_tiet,
            phong_hoc,
            ngay_bat_dau,
            ngay_ket_thuc
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        )
        ${cauTruyVanLichHocCoSo.replace("FROM lich_hoc lh", "FROM inserted lh")}
      `,
      [data.maMonHoc, data.thu, data.tietBatDau, data.soTiet, data.phongHoc, data.ngayBatDau, data.ngayKetThuc]
    );

    const lichHoc = ketQua.rows[0];

    if (!lichHoc) {
      throw new Error("Tao lich hoc that bai");
    }

    return anhXaLichHoc(lichHoc);
  }

  async capNhat(maLichHoc: string, data: DuLieuLichHoc, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongLichHoc>(
      `
        WITH updated AS (
          UPDATE lich_hoc
          SET ma_mon_hoc = $2,
              thu = $3,
              tiet_bat_dau = $4,
              so_tiet = $5,
              phong_hoc = $6,
              ngay_bat_dau = $7,
              ngay_ket_thuc = $8
          WHERE ma_lich_hoc = $1
          RETURNING *
        )
        ${cauTruyVanLichHocCoSo.replace("FROM lich_hoc lh", "FROM updated lh")}
      `,
      [
        maLichHoc,
        data.maMonHoc,
        data.thu,
        data.tietBatDau,
        data.soTiet,
        data.phongHoc,
        data.ngayBatDau,
        data.ngayKetThuc
      ]
    );

    return ketQua.rows[0] ? anhXaLichHoc(ketQua.rows[0]) : null;
  }

  async xoa(maLichHoc: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan("DELETE FROM lich_hoc WHERE ma_lich_hoc = $1", [maLichHoc]);

    return (ketQua.rowCount ?? 0) > 0;
  }

  async taoNhieu(dsLichHoc: DuLieuLichHoc[], boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    if (dsLichHoc.length === 0) {
      return [];
    }

    const ketQua = await boThucThi.truyVan<DongLichHoc>(
      `
        WITH data AS (
          SELECT *
          FROM unnest(
            $1::uuid[],
            $2::smallint[],
            $3::smallint[],
            $4::smallint[],
            $5::text[],
            $6::date[],
            $7::date[]
          ) AS rows(ma_mon_hoc, thu, tiet_bat_dau, so_tiet, phong_hoc, ngay_bat_dau, ngay_ket_thuc)
        ),
        inserted AS (
          INSERT INTO lich_hoc (
            ma_mon_hoc,
            thu,
            tiet_bat_dau,
            so_tiet,
            phong_hoc,
            ngay_bat_dau,
            ngay_ket_thuc
          )
          SELECT ma_mon_hoc, thu, tiet_bat_dau, so_tiet, phong_hoc, ngay_bat_dau, ngay_ket_thuc
          FROM data
          RETURNING *
        )
        ${cauTruyVanLichHocCoSo.replace("FROM lich_hoc lh", "FROM inserted lh")}
        ORDER BY lh.thu ASC, lh.tiet_bat_dau ASC
      `,
      [
        dsLichHoc.map((item) => item.maMonHoc),
        dsLichHoc.map((item) => item.thu),
        dsLichHoc.map((item) => item.tietBatDau),
        dsLichHoc.map((item) => item.soTiet),
        dsLichHoc.map((item) => item.phongHoc),
        dsLichHoc.map((item) => item.ngayBatDau),
        dsLichHoc.map((item) => item.ngayKetThuc)
      ]
    );

    return ketQua.rows.map(anhXaLichHoc);
  }
}
