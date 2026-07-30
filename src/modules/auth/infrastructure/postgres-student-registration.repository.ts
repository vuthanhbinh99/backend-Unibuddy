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
  maTruongCode?: string | null;
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
  maTruongCode: row.maTruongCode ?? null,
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
    loaiTruMaNguoiDung: string | null = null,
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
            AND ($3::uuid IS NULL OR ma_nguoi_dung <> $3::uuid)
        ) AS "exists"
      `,
      [maSinhVien, maTruong, loaiTruMaNguoiDung]
    );

    return ketQua.rows[0]?.exists ?? false;
  }

  async timHoSoSinhVienTheoNguoiDung(
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongHoSoSinhVienDangKy>(
      `
        SELECT
          hsv.ma_nguoi_dung AS "maNguoiDung",
          hsv.ma_sinh_vien AS "maSinhVien",
          hsv.ma_truong AS "maTruong",
          th.ma_truong_code AS "maTruongCode",
          hsv.nganh_hoc AS "nganhHoc",
          hsv.khoa_hoc AS "khoaHoc"
        FROM ho_so_sinh_vien hsv
        LEFT JOIN truong_hoc th ON th.ma_truong = hsv.ma_truong
        WHERE hsv.ma_nguoi_dung = $1
        LIMIT 1
      `,
      [maNguoiDung]
    );

    return ketQua.rows[0] ? anhXaHoSoSinhVien(ketQua.rows[0]) : null;
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
          NULL::text AS "maTruongCode",
          nganh_hoc AS "nganhHoc",
          khoa_hoc AS "khoaHoc"
      `,
      [data.maNguoiDung, data.maTruong, data.maSinhVien, data.nganhHoc, data.khoaHoc]
    );

    return anhXaHoSoSinhVien(ketQua.rows[0]);
  }

  async capNhatMaSinhVien(
    maNguoiDung: string,
    maSinhVien: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongHoSoSinhVienDangKy>(
      `
        UPDATE ho_so_sinh_vien
        SET ma_sinh_vien = $2,
            thoi_gian_cap_nhat = NOW()
        WHERE ma_nguoi_dung = $1
        RETURNING
          ma_nguoi_dung AS "maNguoiDung",
          ma_sinh_vien AS "maSinhVien",
          ma_truong AS "maTruong",
          NULL::text AS "maTruongCode",
          nganh_hoc AS "nganhHoc",
          khoa_hoc AS "khoaHoc"
      `,
      [maNguoiDung, maSinhVien]
    );

    return ketQua.rows[0] ? anhXaHoSoSinhVien(ketQua.rows[0]) : null;
  }
}
