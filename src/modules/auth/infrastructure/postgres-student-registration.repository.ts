import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  HoSoSinhVienDangKy,
  KhoDangKySinhVien,
  TruongHocDangKy
} from "../application/ports/student-registration.repository.js";

type DongTruongHocDangKy = {
  maTruong: number;
  maTruongCode: string;
  tenTruong: string;
};

type DongHoSoSinhVienDangKy = {
  maNguoiDung: string;
  maSinhVien: string;
  maTruong: number | null;
  nganhHoc: string | null;
  khoaHoc: string | null;
};

const anhXaTruongHoc = (row: DongTruongHocDangKy): TruongHocDangKy => ({
  maTruong: row.maTruong,
  maTruongCode: row.maTruongCode,
  tenTruong: row.tenTruong
});

const anhXaHoSoSinhVien = (row: DongHoSoSinhVienDangKy): HoSoSinhVienDangKy => ({
  maNguoiDung: row.maNguoiDung,
  maSinhVien: row.maSinhVien,
  maTruong: row.maTruong,
  nganhHoc: row.nganhHoc,
  khoaHoc: row.khoaHoc
});

export class KhoDangKySinhVienPostgres implements KhoDangKySinhVien {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async timTruongTheoMa(maTruong: number, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongTruongHocDangKy>(
      `
        SELECT
          ma_truong AS "maTruong",
          ma_truong_code AS "maTruongCode",
          ten_truong AS "tenTruong"
        FROM truong_hoc
        WHERE ma_truong = $1
        LIMIT 1
      `,
      [maTruong]
    );

    return ketQua.rows[0] ? anhXaTruongHoc(ketQua.rows[0]) : null;
  }

  async timTruongTheoCode(maTruongCode: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongTruongHocDangKy>(
      `
        SELECT
          ma_truong AS "maTruong",
          ma_truong_code AS "maTruongCode",
          ten_truong AS "tenTruong"
        FROM truong_hoc
        WHERE LOWER(ma_truong_code) = LOWER($1)
        LIMIT 1
      `,
      [maTruongCode]
    );

    return ketQua.rows[0] ? anhXaTruongHoc(ketQua.rows[0]) : null;
  }

  async tonTaiMaSinhVien(
    maSinhVien: string,
    maTruong: number | null,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM ho_so_sinh_vien
          WHERE LOWER(ma_sinh_vien) = LOWER($1)
            AND (
              $2::integer IS NULL
              OR ma_truong = $2
              OR ma_truong IS NULL
            )
        ) AS "exists"
      `,
      [maSinhVien, maTruong]
    );

    return ketQua.rows[0]?.exists ?? false;
  }

  async taoHoSoSinhVien(
    data: HoSoSinhVienDangKy,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongHoSoSinhVienDangKy>(
      `
        INSERT INTO ho_so_sinh_vien (
          ma_nguoi_dung,
          ma_truong,
          ma_sinh_vien,
          nganh_hoc,
          khoa_hoc,
          thoi_gian_tao,
          thoi_gian_cap_nhat
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING
          ma_nguoi_dung AS "maNguoiDung",
          ma_sinh_vien AS "maSinhVien",
          ma_truong AS "maTruong",
          nganh_hoc AS "nganhHoc",
          khoa_hoc AS "khoaHoc"
      `,
      [data.maNguoiDung, data.maTruong, data.maSinhVien, data.nganhHoc, data.khoaHoc]
    );

    return anhXaHoSoSinhVien(ketQua.rows[0]);
  }
}
