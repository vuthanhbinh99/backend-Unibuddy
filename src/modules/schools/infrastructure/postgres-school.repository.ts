import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  DuLieuCapNhatTruongHoc,
  DuLieuTaoTruongHoc,
  KhoTruongHoc
} from "../application/ports/school.repository.js";
import type { TruongHoc } from "../domain/school.js";

type DongTruongHoc = {
  maTruongCode: string;
  tenTruong: string;
  createdAt: Date;
  updatedAt: Date;
};

const anhXaTruongHoc = (row: DongTruongHoc): TruongHoc => ({
  maTruongCode: row.maTruongCode,
  tenTruong: row.tenTruong,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const cauTruyVanCoSo = `
  SELECT
    th.ma_truong_code AS "maTruongCode",
    th.ten_truong AS "tenTruong",
    th.thoi_gian_tao AS "createdAt",
    th.thoi_gian_cap_nhat AS "updatedAt"
  FROM truong_hoc th
`;

export class KhoTruongHocPostgres implements KhoTruongHoc {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async lietKe(boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongTruongHoc>(`
      ${cauTruyVanCoSo}
      ORDER BY th.ten_truong ASC, th.ma_truong_code ASC
    `);

    return ketQua.rows.map(anhXaTruongHoc);
  }

  async timTheoMa(maTruongCode: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongTruongHoc>(`
      ${cauTruyVanCoSo}
      WHERE th.ma_truong_code = $1
      LIMIT 1
    `, [maTruongCode]);

    return ketQua.rows[0] ? anhXaTruongHoc(ketQua.rows[0]) : null;
  }

  async demSoHoSoSinhVienTheoMaTruongCode(
    maTruongCode: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<{ total: number }>(
      `
        SELECT COUNT(*)::int AS "total"
        FROM ho_so_sinh_vien
        WHERE ma_truong_code = $1
      `,
      [maTruongCode]
    );

    return ketQua.rows[0]?.total ?? 0;
  }

  async tao(data: DuLieuTaoTruongHoc, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    await boThucThi.truyVan(
      `
        INSERT INTO truong_hoc (
          ma_truong_code,
          ten_truong,
          thoi_gian_tao,
          thoi_gian_cap_nhat
        )
        VALUES ($1, $2, NOW(), NOW())
      `,
      [data.maTruongCode, data.tenTruong]
    );

    const truongHoc = await this.timTheoMa(data.maTruongCode, boThucThi);

    if (!truongHoc) {
      throw new Error("Tạo trường học thất bại");
    }

    return truongHoc;
  }

  async capNhat(data: DuLieuCapNhatTruongHoc, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongTruongHoc>(
      `
        UPDATE truong_hoc
        SET ten_truong = $2,
            thoi_gian_cap_nhat = NOW()
        WHERE ma_truong_code = $1
        RETURNING
          ma_truong_code AS "maTruongCode",
          ten_truong AS "tenTruong",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt"
      `,
      [data.maTruongCode, data.tenTruong]
    );

    return ketQua.rows[0] ? anhXaTruongHoc(ketQua.rows[0]) : null;
  }

  async xoaDuLieuLienQuanTheoMaTruongCode(
    maTruongCode: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    await boThucThi.truyVan(
      `DELETE FROM chi_tiet_thang_diem WHERE ma_truong_code = $1`,
      [maTruongCode]
    );

    await boThucThi.truyVan(
      `DELETE FROM quy_che_hoc_luc WHERE ma_truong_code = $1`,
      [maTruongCode]
    );
  }

  async xoaTheoMa(maTruongCode: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan(
      `DELETE FROM truong_hoc WHERE ma_truong_code = $1`,
      [maTruongCode]
    );

    return (ketQua.rowCount ?? 0) > 0;
  }
}
