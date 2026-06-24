import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type { BoLocDeadline, DuLieuTaoNhacNhoDeadline, KhoDeadline } from "../application/ports/deadline.repository.js";
import type {
  Deadline,
  DuLieuTaoDeadline,
  MonHocDeadline,
  NhacNhoDeadline,
  TrangThaiDeadline
} from "../domain/deadline.js";

type DongDeadline = {
  maDeadline: string;
  maMonHoc: string;
  maNguoiDung: string;
  maHocKy: string;
  maMon: string | null;
  tenMon: string;
  tieuDe: string;
  moTa: string | null;
  hanNop: Date;
  trangThai: TrangThaiDeadline;
  soNhacNho: string | number;
  createdAt: Date;
  updatedAt: Date;
};

type DongMonHocDeadline = {
  maMonHoc: string;
  maNguoiDung: string;
  maHocKy: string;
  maMon: string | null;
  tenMon: string;
};

type DongNhacNhoDeadline = {
  maNhacNho: string;
  maNguoiDung: string;
  maDeadline: string;
  thoiGianNhac: Date;
  thoiGianDaGui: Date | null;
  createdAt: Date;
};

const anhXaDeadline = (row: DongDeadline): Deadline => ({
  maDeadline: row.maDeadline,
  maMonHoc: row.maMonHoc,
  maNguoiDung: row.maNguoiDung,
  maHocKy: row.maHocKy,
  maMon: row.maMon,
  tenMon: row.tenMon,
  tieuDe: row.tieuDe,
  moTa: row.moTa,
  hanNop: row.hanNop,
  trangThai: row.trangThai,
  soNhacNho: Number(row.soNhacNho),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const anhXaMonHoc = (row: DongMonHocDeadline): MonHocDeadline => ({
  maMonHoc: row.maMonHoc,
  maNguoiDung: row.maNguoiDung,
  maHocKy: row.maHocKy,
  maMon: row.maMon,
  tenMon: row.tenMon
});

const anhXaNhacNho = (row: DongNhacNhoDeadline): NhacNhoDeadline => ({
  maNhacNho: row.maNhacNho,
  maNguoiDung: row.maNguoiDung,
  maDeadline: row.maDeadline,
  thoiGianNhac: row.thoiGianNhac,
  thoiGianDaGui: row.thoiGianDaGui,
  createdAt: row.createdAt
});

const cauTruyVanDeadlineCoSo = `
  SELECT
    dl.ma_deadline AS "maDeadline",
    dl.ma_mon_hoc AS "maMonHoc",
    hk.ma_nguoi_dung AS "maNguoiDung",
    mh.ma_hoc_ky AS "maHocKy",
    mh.ma_mon AS "maMon",
    mh.ten_mon AS "tenMon",
    dl.tieu_de AS "tieuDe",
    dl.mo_ta AS "moTa",
    dl.han_nop AS "hanNop",
    dl.trang_thai AS "trangThai",
    COUNT(nn.ma_nhac_nho)::int AS "soNhacNho",
    dl.thoi_gian_tao AS "createdAt",
    dl.thoi_gian_cap_nhat AS "updatedAt"
  FROM deadline dl
  INNER JOIN mon_hoc mh ON mh.ma_mon_hoc = dl.ma_mon_hoc
  INNER JOIN hoc_ky hk ON hk.ma_hoc_ky = mh.ma_hoc_ky
  LEFT JOIN nhac_nho nn ON nn.ma_deadline = dl.ma_deadline
`;

const nhomCotDeadline = `
  GROUP BY
    dl.ma_deadline,
    dl.ma_mon_hoc,
    hk.ma_nguoi_dung,
    mh.ma_hoc_ky,
    mh.ma_mon,
    mh.ten_mon,
    dl.tieu_de,
    dl.mo_ta,
    dl.han_nop,
    dl.trang_thai,
    dl.thoi_gian_tao,
    dl.thoi_gian_cap_nhat
`;

export class KhoDeadlinePostgres implements KhoDeadline {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async lietKe(boLoc: BoLocDeadline, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const dieuKien = ["hk.ma_nguoi_dung = $1"];
    const thamSo: unknown[] = [boLoc.actorId];

    if (boLoc.maMonHoc) {
      thamSo.push(boLoc.maMonHoc);
      dieuKien.push(`dl.ma_mon_hoc = $${thamSo.length}`);
    }

    if (boLoc.trangThai) {
      thamSo.push(boLoc.trangThai);
      dieuKien.push(`dl.trang_thai = $${thamSo.length}`);
    }

    const ketQua = await boThucThi.truyVan<DongDeadline>(
      `
        ${cauTruyVanDeadlineCoSo}
        WHERE ${dieuKien.join(" AND ")}
        ${nhomCotDeadline}
        ORDER BY dl.han_nop ASC, dl.thoi_gian_tao DESC
      `,
      thamSo
    );

    return ketQua.rows.map(anhXaDeadline);
  }

  async timTheoMaCuaSinhVien(
    maDeadline: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongDeadline>(
      `
        ${cauTruyVanDeadlineCoSo}
        WHERE dl.ma_deadline = $1
          AND hk.ma_nguoi_dung = $2
        ${nhomCotDeadline}
        LIMIT 1
      `,
      [maDeadline, maNguoiDung]
    );

    return ketQua.rows[0] ? anhXaDeadline(ketQua.rows[0]) : null;
  }

  async timMonHocCuaSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongMonHocDeadline>(
      `
        SELECT
          mh.ma_mon_hoc AS "maMonHoc",
          hk.ma_nguoi_dung AS "maNguoiDung",
          mh.ma_hoc_ky AS "maHocKy",
          mh.ma_mon AS "maMon",
          mh.ten_mon AS "tenMon"
        FROM mon_hoc mh
        INNER JOIN hoc_ky hk ON hk.ma_hoc_ky = mh.ma_hoc_ky
        WHERE mh.ma_mon_hoc = $1
          AND hk.ma_nguoi_dung = $2
        LIMIT 1
      `,
      [maMonHoc, maNguoiDung]
    );

    return ketQua.rows[0] ? anhXaMonHoc(ketQua.rows[0]) : null;
  }

  async tao(data: DuLieuTaoDeadline, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongDeadline>(
      `
        WITH inserted AS (
          INSERT INTO deadline (
            ma_mon_hoc,
            tieu_de,
            mo_ta,
            han_nop,
            trang_thai,
            thoi_gian_tao,
            thoi_gian_cap_nhat
          )
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING *
        )
        ${cauTruyVanDeadlineCoSo.replace("FROM deadline dl", "FROM inserted dl")}
        ${nhomCotDeadline}
      `,
      [data.maMonHoc, data.tieuDe, data.moTa, data.hanNop, data.trangThai]
    );

    const deadline = ketQua.rows[0];

    if (!deadline) {
      throw new Error("Tao deadline that bai");
    }

    return anhXaDeadline(deadline);
  }

  async taoNhacNhoNhieu(
    data: DuLieuTaoNhacNhoDeadline,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    if (data.thoiGianNhac.length === 0) {
      return [];
    }

    const ketQua = await boThucThi.truyVan<DongNhacNhoDeadline>(
      `
        INSERT INTO nhac_nho (
          ma_nguoi_dung,
          ma_deadline,
          ma_lich_thi,
          thoi_gian_nhac,
          thoi_gian_tao
        )
        SELECT
          $1,
          $2,
          NULL,
          moc.thoi_gian_nhac,
          NOW()
        FROM unnest($3::timestamptz[]) AS moc(thoi_gian_nhac)
        ORDER BY moc.thoi_gian_nhac ASC
        RETURNING
          ma_nhac_nho AS "maNhacNho",
          ma_nguoi_dung AS "maNguoiDung",
          ma_deadline AS "maDeadline",
          thoi_gian_nhac AS "thoiGianNhac",
          thoi_gian_da_gui AS "thoiGianDaGui",
          thoi_gian_tao AS "createdAt"
      `,
      [data.maNguoiDung, data.maDeadline, data.thoiGianNhac.map((item) => item.toISOString())]
    );

    return ketQua.rows.map(anhXaNhacNho);
  }

  async capNhatTrangThai(
    maDeadline: string,
    trangThai: TrangThaiDeadline,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongDeadline>(
      `
        WITH updated AS (
          UPDATE deadline
          SET trang_thai = $2,
              thoi_gian_cap_nhat = NOW()
          WHERE ma_deadline = $1
          RETURNING *
        )
        ${cauTruyVanDeadlineCoSo.replace("FROM deadline dl", "FROM updated dl")}
        ${nhomCotDeadline}
      `,
      [maDeadline, trangThai]
    );

    return ketQua.rows[0] ? anhXaDeadline(ketQua.rows[0]) : null;
  }

  async xoaNhacNhoTheoDeadline(maDeadline: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan("DELETE FROM nhac_nho WHERE ma_deadline = $1", [maDeadline]);

    return ketQua.rowCount ?? 0;
  }

  async xoa(maDeadline: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan("DELETE FROM deadline WHERE ma_deadline = $1", [maDeadline]);

    return (ketQua.rowCount ?? 0) > 0;
  }
}
