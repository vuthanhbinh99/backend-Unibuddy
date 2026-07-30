import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  BoLocLichThi,
  BoLocMonHocImportLichThi,
  KhoLichThi
} from "../application/ports/exam.repository.js";
import type { DuLieuLichThi, LichThi, MonHocChoLichThi, NhacNhoLichThiDenHan } from "../domain/exam.js";

type DongLichThi = {
  maLichThi: string;
  maMonHoc: string;
  maHocKy: string;
  maNguoiDung: string;
  maMon: string | null;
  tenMon: string;
  tenHocKy: string;
  thoiGianThi: Date;
  phongThi: string | null;
  diaDiemThi: string | null;
  soNhacNho: string | number;
};

type DongMonHoc = {
  maMonHoc: string;
  maHocKy: string;
  maMon: string | null;
  tenMon: string;
  tenHocKy: string;
};

const anhXaLichThi = (row: DongLichThi): LichThi => ({
  maLichThi: row.maLichThi,
  maMonHoc: row.maMonHoc,
  maHocKy: row.maHocKy,
  maNguoiDung: row.maNguoiDung,
  maMon: row.maMon,
  tenMon: row.tenMon,
  tenHocKy: row.tenHocKy,
  thoiGianThi: row.thoiGianThi,
  phongThi: row.phongThi,
  diaDiemThi: row.diaDiemThi,
  soNhacNho: Number(row.soNhacNho ?? 0)
});

const anhXaMonHoc = (row: DongMonHoc): MonHocChoLichThi => ({
  maMonHoc: row.maMonHoc,
  maHocKy: row.maHocKy,
  maMon: row.maMon,
  tenMon: row.tenMon,
  tenHocKy: row.tenHocKy
});

const cauTruyVanLichThiCoSo = `
  SELECT
    lt.ma_lich_thi AS "maLichThi",
    lt.ma_mon_hoc AS "maMonHoc",
    mh.ma_hoc_ky AS "maHocKy",
    hk.ma_nguoi_dung AS "maNguoiDung",
    mh.ma_mon AS "maMon",
    mh.ten_mon AS "tenMon",
    hk.ten_hoc_ky AS "tenHocKy",
    lt.thoi_gian_thi AS "thoiGianThi",
    lt.phong_thi AS "phongThi",
    lt.dia_diem_thi AS "diaDiemThi",
    COUNT(nn.ma_nhac_nho)::int AS "soNhacNho"
  FROM lich_thi lt
  INNER JOIN mon_hoc mh ON mh.ma_mon_hoc = lt.ma_mon_hoc
  INNER JOIN hoc_ky hk ON hk.ma_hoc_ky = mh.ma_hoc_ky
  LEFT JOIN nhac_nho nn ON nn.ma_lich_thi = lt.ma_lich_thi
`;

const nhomCotLichThi = `
  GROUP BY
    lt.ma_lich_thi,
    lt.ma_mon_hoc,
    mh.ma_hoc_ky,
    hk.ma_nguoi_dung,
    mh.ma_mon,
    mh.ten_mon,
    hk.ten_hoc_ky,
    lt.thoi_gian_thi,
    lt.phong_thi,
    lt.dia_diem_thi
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

export class KhoLichThiPostgres implements KhoLichThi {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async lietKeTheoSinhVien(
    maNguoiDung: string,
    boLoc: BoLocLichThi = {},
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const thamSo: unknown[] = [maNguoiDung];
    const dieuKien = ["hk.ma_nguoi_dung = $1"];

    if (boLoc.maMonHoc) {
      thamSo.push(boLoc.maMonHoc);
      dieuKien.push(`lt.ma_mon_hoc = $${thamSo.length}`);
    }

    const ketQua = await boThucThi.truyVan<DongLichThi>(
      `
        ${cauTruyVanLichThiCoSo}
        WHERE ${dieuKien.join(" AND ")}
        ${nhomCotLichThi}
        ORDER BY lt.thoi_gian_thi ASC, mh.ten_mon ASC
      `,
      thamSo
    );

    return ketQua.rows.map(anhXaLichThi);
  }

  async timTheoMaCuaSinhVien(
    maLichThi: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongLichThi>(
      `
        ${cauTruyVanLichThiCoSo}
        WHERE lt.ma_lich_thi = $1
          AND hk.ma_nguoi_dung = $2
        ${nhomCotLichThi}
        LIMIT 1
      `,
      [maLichThi, maNguoiDung]
    );

    return ketQua.rows[0] ? anhXaLichThi(ketQua.rows[0]) : null;
  }

  async timMonHocCuaSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongMonHoc>(
      `
        ${cauTruyVanMonHocCoSo}
        WHERE mh.ma_mon_hoc = $1
          AND hk.ma_nguoi_dung = $2
        LIMIT 1
      `,
      [maMonHoc, maNguoiDung]
    );

    return ketQua.rows[0] ? anhXaMonHoc(ketQua.rows[0]) : null;
  }

  async timMonHocChoImport(boLoc: BoLocMonHocImportLichThi, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    if (!boLoc.maMonHoc && !boLoc.maMon && !boLoc.tenMon) {
      return [];
    }

    const ketQua = await boThucThi.truyVan<DongMonHoc>(
      `
        ${cauTruyVanMonHocCoSo}
        WHERE hk.ma_nguoi_dung = $1
          AND ($2::uuid IS NULL OR mh.ma_hoc_ky = $2::uuid)
          AND (
            (
              CASE
                WHEN $3::text IS NOT NULL
                  AND $3::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                THEN mh.ma_mon_hoc = $3::uuid
                ELSE FALSE
              END
            )
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

  async tao(data: DuLieuLichThi, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongLichThi>(
      `
        WITH inserted AS (
          INSERT INTO lich_thi (ma_mon_hoc, thoi_gian_thi, phong_thi, dia_diem_thi)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        )
        ${cauTruyVanLichThiCoSo.replace("FROM lich_thi lt", "FROM inserted lt")}
        ${nhomCotLichThi}
      `,
      [data.maMonHoc, data.thoiGianThi.toISOString(), data.phongThi, data.diaDiemThi]
    );

    const lichThi = ketQua.rows[0];

    if (!lichThi) {
      throw new Error("Tao lich thi that bai");
    }

    return anhXaLichThi(lichThi);
  }

  async taoNhieu(dsLichThi: DuLieuLichThi[], boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    if (dsLichThi.length === 0) {
      return [];
    }

    const ketQua = await boThucThi.truyVan<DongLichThi>(
      `
        WITH data AS (
          SELECT *
          FROM unnest($1::uuid[], $2::timestamptz[], $3::text[], $4::text[])
            AS rows(ma_mon_hoc, thoi_gian_thi, phong_thi, dia_diem_thi)
        ),
        inserted AS (
          INSERT INTO lich_thi (ma_mon_hoc, thoi_gian_thi, phong_thi, dia_diem_thi)
          SELECT ma_mon_hoc, thoi_gian_thi, phong_thi, dia_diem_thi
          FROM data
          RETURNING *
        )
        ${cauTruyVanLichThiCoSo.replace("FROM lich_thi lt", "FROM inserted lt")}
        ${nhomCotLichThi}
        ORDER BY lt.thoi_gian_thi ASC
      `,
      [
        dsLichThi.map((item) => item.maMonHoc),
        dsLichThi.map((item) => item.thoiGianThi.toISOString()),
        dsLichThi.map((item) => item.phongThi),
        dsLichThi.map((item) => item.diaDiemThi)
      ]
    );

    return ketQua.rows.map(anhXaLichThi);
  }

  async capNhat(maLichThi: string, data: DuLieuLichThi, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongLichThi>(
      `
        WITH updated AS (
          UPDATE lich_thi
          SET ma_mon_hoc = $2,
              thoi_gian_thi = $3,
              phong_thi = $4,
              dia_diem_thi = $5
          WHERE ma_lich_thi = $1
          RETURNING *
        )
        ${cauTruyVanLichThiCoSo.replace("FROM lich_thi lt", "FROM updated lt")}
        ${nhomCotLichThi}
      `,
      [maLichThi, data.maMonHoc, data.thoiGianThi.toISOString(), data.phongThi, data.diaDiemThi]
    );

    return ketQua.rows[0] ? anhXaLichThi(ketQua.rows[0]) : null;
  }

  async xoa(maLichThi: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan("DELETE FROM lich_thi WHERE ma_lich_thi = $1", [maLichThi]);

    return (ketQua.rowCount ?? 0) > 0;
  }

  async xoaTheoMonHoc(dsMaMonHoc: string[], boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    if (dsMaMonHoc.length === 0) {
      return 0;
    }

    await boThucThi.truyVan(
      `
        DELETE FROM nhac_nho nn
        USING lich_thi lt
        WHERE nn.ma_lich_thi = lt.ma_lich_thi
          AND lt.ma_mon_hoc = ANY($1::uuid[])
      `,
      [dsMaMonHoc]
    );

    const ketQua = await boThucThi.truyVan("DELETE FROM lich_thi WHERE ma_mon_hoc = ANY($1::uuid[])", [
      dsMaMonHoc
    ]);

    return ketQua.rowCount ?? 0;
  }

  async taoNhacNhoTruocMotNgay(
    maNguoiDung: string,
    maLichThi: string,
    thoiGianThi: Date,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const thoiGianNhac = new Date(thoiGianThi.getTime() - 24 * 60 * 60 * 1000);

    if (thoiGianNhac.getTime() <= Date.now()) {
      return 0;
    }

    const ketQua = await boThucThi.truyVan(
      `
        INSERT INTO nhac_nho (ma_nguoi_dung, ma_deadline, ma_lich_thi, thoi_gian_nhac, thoi_gian_tao)
        VALUES ($1, NULL, $2, $3, NOW())
      `,
      [maNguoiDung, maLichThi, thoiGianNhac.toISOString()]
    );

    return ketQua.rowCount ?? 0;
  }

  async xoaNhacNhoTheoLichThi(maLichThi: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan("DELETE FROM nhac_nho WHERE ma_lich_thi = $1", [maLichThi]);

    return ketQua.rowCount ?? 0;
  }

  async nhanNhacNhoLichThiDenHanVaKhoa(
    gioiHan: number,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ): Promise<NhacNhoLichThiDenHan[]> {
    const ketQua = await boThucThi.truyVan<NhacNhoLichThiDenHan>(
      `
        WITH den_han AS (
          SELECT nn.ma_nhac_nho
          FROM nhac_nho nn
          INNER JOIN lich_thi lt ON lt.ma_lich_thi = nn.ma_lich_thi
          WHERE nn.ma_lich_thi IS NOT NULL
            AND nn.thoi_gian_da_gui IS NULL
            AND nn.thoi_gian_nhac <= NOW()
            AND lt.thoi_gian_thi > NOW()
          ORDER BY nn.thoi_gian_nhac ASC
          LIMIT $1
          FOR UPDATE OF nn SKIP LOCKED
        ),
        da_khoa AS (
          UPDATE nhac_nho nn
          SET thoi_gian_da_gui = NOW()
          FROM den_han
          WHERE nn.ma_nhac_nho = den_han.ma_nhac_nho
          RETURNING nn.ma_nhac_nho, nn.ma_nguoi_dung, nn.ma_lich_thi, nn.thoi_gian_nhac
        )
        SELECT
          da_khoa.ma_nhac_nho AS "maNhacNho",
          da_khoa.ma_nguoi_dung AS "maNguoiDung",
          da_khoa.ma_lich_thi AS "maLichThi",
          da_khoa.thoi_gian_nhac AS "thoiGianNhac",
          mh.ma_mon AS "maMon",
          mh.ten_mon AS "tenMon",
          lt.thoi_gian_thi AS "thoiGianThi",
          lt.phong_thi AS "phongThi",
          lt.dia_diem_thi AS "diaDiemThi"
        FROM da_khoa
        INNER JOIN lich_thi lt ON lt.ma_lich_thi = da_khoa.ma_lich_thi
        INNER JOIN mon_hoc mh ON mh.ma_mon_hoc = lt.ma_mon_hoc
        ORDER BY lt.thoi_gian_thi ASC
      `,
      [gioiHan]
    );

    return ketQua.rows;
  }

  async danhDauNhacNhoChuaGui(maNhacNhos: string[], boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    if (maNhacNhos.length === 0) {
      return;
    }

    await boThucThi.truyVan(
      "UPDATE nhac_nho SET thoi_gian_da_gui = NULL WHERE ma_nhac_nho = ANY($1::uuid[])",
      [maNhacNhos]
    );
  }
}
