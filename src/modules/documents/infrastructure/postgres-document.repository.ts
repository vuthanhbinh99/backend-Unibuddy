import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  BoLocDanhSachTaiLieuSinhVien,
  DuLieuTaoTaiLieu,
  KhoTaiLieu
} from "../application/ports/document.repository.js";
import type {
  CheDoHienThiTaiLieu,
  TaiLieu,
  TaiLieuLuuTruSinhVien,
  TrangThaiTaiLieu
} from "../domain/document.js";

type DongTaiLieu = {
  maTaiLieu: string;
  nguoiTaiLen: string;
  maMonHoc: string | null;
  maNhom: string | null;
  maGhiChu: string | null;
  duongDanLuuTru: string;
  tenFile: string;
  loaiFile: string | null;
  dungLuong: string | number | null;
  cheDoHienThi: CheDoHienThiTaiLieu;
  trangThai: TrangThaiTaiLieu;
  createdAt: Date;
  updatedAt: Date;
};

type DongTaiLieuLuuTruSinhVien = DongTaiLieu & {
  tenNguoiTaiLen: string | null;
  emailNguoiTaiLen: string | null;
  maMon: string | null;
  tenMonHoc: string | null;
  tenNhom: string | null;
  totalRows: string | number;
  totalBytes: string | number | null;
};

const anhXaDungLuong = (value: string | number | null): number | null => {
  if (value === null) {
    return null;
  }

  return Number(value);
};

const anhXaTaiLieu = (row: DongTaiLieu): TaiLieu => ({
  maTaiLieu: row.maTaiLieu,
  nguoiTaiLen: row.nguoiTaiLen,
  maMonHoc: row.maMonHoc,
  maNhom: row.maNhom,
  maGhiChu: row.maGhiChu,
  duongDanLuuTru: row.duongDanLuuTru,
  tenFile: row.tenFile,
  loaiFile: row.loaiFile,
  dungLuong: anhXaDungLuong(row.dungLuong),
  cheDoHienThi: row.cheDoHienThi,
  trangThai: row.trangThai,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const anhXaTaiLieuLuuTruSinhVien = (row: DongTaiLieuLuuTruSinhVien): TaiLieuLuuTruSinhVien => ({
  ...anhXaTaiLieu(row),
  tenNguoiTaiLen: row.tenNguoiTaiLen,
  emailNguoiTaiLen: row.emailNguoiTaiLen,
  maMon: row.maMon,
  tenMonHoc: row.tenMonHoc,
  tenNhom: row.tenNhom
});

const cauTruyVanCoSo = `
  SELECT
    tl.ma_tai_lieu AS "maTaiLieu",
    tl.nguoi_tai_len AS "nguoiTaiLen",
    tl.ma_mon_hoc AS "maMonHoc",
    tl.ma_nhom AS "maNhom",
    tl.ma_ghi_chu AS "maGhiChu",
    tl.duong_dan_luu_tru AS "duongDanLuuTru",
    tl.ten_file AS "tenFile",
    tl.loai_file AS "loaiFile",
    tl.dung_luong AS "dungLuong",
    tl.che_do_hien_thi AS "cheDoHienThi",
    tl.trang_thai AS "trangThai",
    tl.thoi_gian_tao AS "createdAt",
    tl.thoi_gian_cap_nhat AS "updatedAt"
  FROM tai_lieu tl
`;

const dieuKienTaiLieuSinhVienDuocXem = `
  tl.trang_thai = 'KHA_DUNG'
  AND (
    tl.nguoi_tai_len = $1
    OR (
      tl.che_do_hien_thi = 'CONG_KHAI'
      AND tl.ma_mon_hoc IN (
        SELECT mh_access.ma_mon_hoc
        FROM mon_hoc mh_access
        INNER JOIN hoc_ky hk_access ON hk_access.ma_hoc_ky = mh_access.ma_hoc_ky
        WHERE hk_access.ma_nguoi_dung = $1
      )
    )
    OR (
      tl.che_do_hien_thi = 'CHIA_SE_NHOM'
      AND tl.ma_nhom IN (
        SELECT tvn_access.ma_nhom
        FROM thanh_vien_nhom tvn_access
        WHERE tvn_access.ma_nguoi_dung = $1
      )
    )
  )
`;

export class KhoTaiLieuPostgres implements KhoTaiLieu {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async tao(data: DuLieuTaoTaiLieu, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongTaiLieu>(
      `
        INSERT INTO tai_lieu (
          nguoi_tai_len,
          ma_mon_hoc,
          ma_nhom,
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
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9::enum_che_do_hien_thi,
          $10::enum_trang_thai_tai_lieu,
          NOW(),
          NOW()
        )
        RETURNING
          ma_tai_lieu AS "maTaiLieu",
          nguoi_tai_len AS "nguoiTaiLen",
          ma_mon_hoc AS "maMonHoc",
          ma_nhom AS "maNhom",
          ma_ghi_chu AS "maGhiChu",
          duong_dan_luu_tru AS "duongDanLuuTru",
          ten_file AS "tenFile",
          loai_file AS "loaiFile",
          dung_luong AS "dungLuong",
          che_do_hien_thi AS "cheDoHienThi",
          trang_thai AS "trangThai",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt"
      `,
      [
        data.nguoiTaiLen,
        data.maMonHoc,
        data.maNhom,
        data.maGhiChu,
        data.duongDanLuuTru,
        data.tenFile,
        data.loaiFile,
        data.dungLuong,
        data.cheDoHienThi,
        data.trangThai
      ]
    );

    const taiLieu = ketQua.rows[0];

    if (!taiLieu) {
      throw new Error("Tao tai lieu that bai");
    }

    return anhXaTaiLieu(taiLieu);
  }

  async timTheoDuongDan(duongDanLuuTru: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongTaiLieu>(
      `
        ${cauTruyVanCoSo}
        WHERE tl.duong_dan_luu_tru = $1
        LIMIT 1
      `,
      [duongDanLuuTru]
    );

    return ketQua.rows[0] ? anhXaTaiLieu(ketQua.rows[0]) : null;
  }

  async lietKeChoSinhVien(
    boLoc: BoLocDanhSachTaiLieuSinhVien,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const query = boLoc.query?.trim() || null;
    const ketQua = await boThucThi.truyVan<DongTaiLieuLuuTruSinhVien>(
      `
        SELECT
          tl.ma_tai_lieu AS "maTaiLieu",
          tl.nguoi_tai_len AS "nguoiTaiLen",
          tl.ma_mon_hoc AS "maMonHoc",
          tl.ma_nhom AS "maNhom",
          tl.ma_ghi_chu AS "maGhiChu",
          tl.duong_dan_luu_tru AS "duongDanLuuTru",
          tl.ten_file AS "tenFile",
          tl.loai_file AS "loaiFile",
          tl.dung_luong AS "dungLuong",
          tl.che_do_hien_thi AS "cheDoHienThi",
          tl.trang_thai AS "trangThai",
          tl.thoi_gian_tao AS "createdAt",
          tl.thoi_gian_cap_nhat AS "updatedAt",
          nd.ho_ten AS "tenNguoiTaiLen",
          nd.email AS "emailNguoiTaiLen",
          mh.ma_mon AS "maMon",
          mh.ten_mon AS "tenMonHoc",
          nht.ten_nhom AS "tenNhom",
          COUNT(*) OVER()::int AS "totalRows",
          COALESCE(SUM(COALESCE(tl.dung_luong, 0)) OVER(), 0)::bigint AS "totalBytes"
        FROM tai_lieu tl
        LEFT JOIN nguoi_dung nd ON nd.ma_nguoi_dung = tl.nguoi_tai_len
        LEFT JOIN mon_hoc mh ON mh.ma_mon_hoc = tl.ma_mon_hoc
        LEFT JOIN nhom_hoc_tap nht ON nht.ma_nhom = tl.ma_nhom
        WHERE ${dieuKienTaiLieuSinhVienDuocXem}
          AND (
            $2::text IS NULL
            OR LOWER(tl.ten_file) LIKE LOWER('%' || $2::text || '%')
            OR LOWER(COALESCE(nd.ho_ten, '')) LIKE LOWER('%' || $2::text || '%')
            OR LOWER(COALESCE(mh.ten_mon, '')) LIKE LOWER('%' || $2::text || '%')
            OR LOWER(COALESCE(mh.ma_mon, '')) LIKE LOWER('%' || $2::text || '%')
            OR LOWER(COALESCE(nht.ten_nhom, '')) LIKE LOWER('%' || $2::text || '%')
          )
        ORDER BY tl.thoi_gian_cap_nhat DESC, tl.thoi_gian_tao DESC
        LIMIT $3
        OFFSET $4
      `,
      [boLoc.maNguoiDung, query, boLoc.limit, boLoc.offset]
    );

    const first = ketQua.rows[0];

    return {
      items: ketQua.rows.map(anhXaTaiLieuLuuTruSinhVien),
      total: first ? Number(first.totalRows) : 0,
      totalBytes: first ? Number(first.totalBytes ?? 0) : 0
    };
  }

  async danhDauXoaCuaSinhVien(
    maTaiLieu: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongTaiLieu>(
      `
        UPDATE tai_lieu
        SET trang_thai = 'DA_XOA',
            thoi_gian_cap_nhat = NOW()
        WHERE ma_tai_lieu = $1
          AND nguoi_tai_len = $2
          AND trang_thai <> 'DA_XOA'
        RETURNING
          ma_tai_lieu AS "maTaiLieu",
          nguoi_tai_len AS "nguoiTaiLen",
          ma_mon_hoc AS "maMonHoc",
          ma_nhom AS "maNhom",
          ma_ghi_chu AS "maGhiChu",
          duong_dan_luu_tru AS "duongDanLuuTru",
          ten_file AS "tenFile",
          loai_file AS "loaiFile",
          dung_luong AS "dungLuong",
          che_do_hien_thi AS "cheDoHienThi",
          trang_thai AS "trangThai",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt"
      `,
      [maTaiLieu, maNguoiDung]
    );

    return ketQua.rows[0] ? anhXaTaiLieu(ketQua.rows[0]) : null;
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
}
