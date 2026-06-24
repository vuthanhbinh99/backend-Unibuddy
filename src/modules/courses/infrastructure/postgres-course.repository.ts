import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  BoLocDanhSachHocPhan,
  DuLieuHocPhanImport,
  DuLieuTimTrungHocPhan,
  KhoHocPhan
} from "../application/ports/course.repository.js";
import type {
  DuLieuCapNhatHocPhan,
  DuLieuTaoHocKy,
  DuLieuTaoHocPhan,
  HocKySinhVien,
  HocPhan,
  ThongKeLienKetHocPhan
} from "../domain/course.js";

type DongHocKy = {
  maHocKy: string;
  maNguoiDung: string;
  tenHocKy: string;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DongHocPhan = {
  maMonHoc: string;
  maHocKy: string;
  maNguoiDung: string;
  maMon: string | null;
  tenMon: string;
  soTinChi: number;
  tenHocKy: string;
  createdAt: Date;
  updatedAt: Date;
};

type DongLienKetHocPhan = {
  lichHoc: string | number;
  lichThi: string | number;
  deadline: string | number;
  thanhPhanDiem: string | number;
  ghiChu: string | number;
  taiLieu: string | number;
  boFlashcard: string | number;
};

const SO_TIN_CHI_MAC_DINH_IMPORT = 1;

const anhXaHocKy = (row: DongHocKy): HocKySinhVien => ({
  maHocKy: row.maHocKy,
  maNguoiDung: row.maNguoiDung,
  tenHocKy: row.tenHocKy,
  ngayBatDau: row.ngayBatDau,
  ngayKetThuc: row.ngayKetThuc,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const anhXaHocPhan = (row: DongHocPhan): HocPhan => ({
  maMonHoc: row.maMonHoc,
  maHocKy: row.maHocKy,
  maNguoiDung: row.maNguoiDung,
  maMon: row.maMon,
  tenMon: row.tenMon,
  soTinChi: row.soTinChi,
  tenHocKy: row.tenHocKy,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const anhXaLienKet = (row: DongLienKetHocPhan): ThongKeLienKetHocPhan => {
  const lichHoc = Number(row.lichHoc);
  const lichThi = Number(row.lichThi);
  const deadline = Number(row.deadline);
  const thanhPhanDiem = Number(row.thanhPhanDiem);
  const ghiChu = Number(row.ghiChu);
  const taiLieu = Number(row.taiLieu);
  const boFlashcard = Number(row.boFlashcard);
  const tongDuLieuHocTap = lichHoc + lichThi + deadline + thanhPhanDiem;

  return {
    lichHoc,
    lichThi,
    deadline,
    thanhPhanDiem,
    ghiChu,
    taiLieu,
    boFlashcard,
    tongDuLieuHocTap,
    tongLienKet: tongDuLieuHocTap + ghiChu + taiLieu + boFlashcard
  };
};

const chuanHoaSoTinChiImport = (soTinChi?: number | null) =>
  soTinChi && Number.isFinite(soTinChi) && soTinChi > 0 ? Math.trunc(soTinChi) : SO_TIN_CHI_MAC_DINH_IMPORT;

const cauTruyVanHocKyCoSo = `
  SELECT
    hk.ma_hoc_ky AS "maHocKy",
    hk.ma_nguoi_dung AS "maNguoiDung",
    hk.ten_hoc_ky AS "tenHocKy",
    hk.ngay_bat_dau::text AS "ngayBatDau",
    hk.ngay_ket_thuc::text AS "ngayKetThuc",
    hk.thoi_gian_tao AS "createdAt",
    hk.thoi_gian_cap_nhat AS "updatedAt"
  FROM hoc_ky hk
`;

const cauTruyVanHocPhanCoSo = `
  SELECT
    mh.ma_mon_hoc AS "maMonHoc",
    mh.ma_hoc_ky AS "maHocKy",
    hk.ma_nguoi_dung AS "maNguoiDung",
    mh.ma_mon AS "maMon",
    mh.ten_mon AS "tenMon",
    mh.so_tin_chi AS "soTinChi",
    hk.ten_hoc_ky AS "tenHocKy",
    mh.thoi_gian_tao AS "createdAt",
    mh.thoi_gian_cap_nhat AS "updatedAt"
  FROM mon_hoc mh
  INNER JOIN hoc_ky hk ON hk.ma_hoc_ky = mh.ma_hoc_ky
`;

export class KhoHocPhanPostgres implements KhoHocPhan {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async lietKeHocKy(maNguoiDung: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongHocKy>(
      `
        ${cauTruyVanHocKyCoSo}
        WHERE hk.ma_nguoi_dung = $1
        ORDER BY
          COALESCE(hk.ngay_bat_dau, hk.thoi_gian_tao::date) DESC,
          hk.thoi_gian_tao DESC
      `,
      [maNguoiDung]
    );

    return ketQua.rows.map(anhXaHocKy);
  }

  async timHocKyTheoTen(
    maNguoiDung: string,
    tenHocKy: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongHocKy>(
      `
        ${cauTruyVanHocKyCoSo}
        WHERE hk.ma_nguoi_dung = $1
          AND LOWER(TRIM(hk.ten_hoc_ky)) = LOWER(TRIM($2))
        LIMIT 1
      `,
      [maNguoiDung, tenHocKy]
    );

    return ketQua.rows[0] ? anhXaHocKy(ketQua.rows[0]) : null;
  }

  async timHocKyCuaSinhVien(
    maHocKy: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongHocKy>(
      `
        ${cauTruyVanHocKyCoSo}
        WHERE hk.ma_hoc_ky = $1
          AND hk.ma_nguoi_dung = $2
        LIMIT 1
      `,
      [maHocKy, maNguoiDung]
    );

    return ketQua.rows[0] ? anhXaHocKy(ketQua.rows[0]) : null;
  }

  async taoHocKy(data: DuLieuTaoHocKy, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongHocKy>(
      `
        INSERT INTO hoc_ky (
          ma_nguoi_dung,
          ten_hoc_ky,
          ngay_bat_dau,
          ngay_ket_thuc,
          thoi_gian_tao,
          thoi_gian_cap_nhat
        )
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING
          ma_hoc_ky AS "maHocKy",
          ma_nguoi_dung AS "maNguoiDung",
          ten_hoc_ky AS "tenHocKy",
          ngay_bat_dau::text AS "ngayBatDau",
          ngay_ket_thuc::text AS "ngayKetThuc",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt"
      `,
      [data.maNguoiDung, data.tenHocKy, data.ngayBatDau, data.ngayKetThuc]
    );

    const hocKy = ketQua.rows[0];

    if (!hocKy) {
      throw new Error("Tao hoc ky that bai");
    }

    return anhXaHocKy(hocKy);
  }

  async lietKeTheoHocKy(
    maNguoiDung: string,
    boLoc: BoLocDanhSachHocPhan,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongHocPhan>(
      `
        ${cauTruyVanHocPhanCoSo}
        WHERE hk.ma_nguoi_dung = $1
          AND mh.ma_hoc_ky = $2
        ORDER BY LOWER(mh.ten_mon) ASC, mh.thoi_gian_tao DESC
      `,
      [maNguoiDung, boLoc.maHocKy]
    );

    return ketQua.rows.map(anhXaHocPhan);
  }

  async timTheoMaCuaSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongHocPhan>(
      `
        ${cauTruyVanHocPhanCoSo}
        WHERE mh.ma_mon_hoc = $1
          AND hk.ma_nguoi_dung = $2
        LIMIT 1
      `,
      [maMonHoc, maNguoiDung]
    );

    return ketQua.rows[0] ? anhXaHocPhan(ketQua.rows[0]) : null;
  }

  async timTrungLap(data: DuLieuTimTrungHocPhan, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongHocPhan>(
      `
        ${cauTruyVanHocPhanCoSo}
        WHERE hk.ma_nguoi_dung = $1
          AND mh.ma_hoc_ky = $2
          AND ($5::uuid IS NULL OR mh.ma_mon_hoc <> $5)
          AND (
            LOWER(TRIM(mh.ten_mon)) = LOWER(TRIM($3))
            OR (
              $4::text IS NOT NULL
              AND mh.ma_mon IS NOT NULL
              AND LOWER(TRIM(mh.ma_mon)) = LOWER(TRIM($4))
            )
          )
        ORDER BY mh.thoi_gian_tao DESC
        LIMIT 1
      `,
      [data.actorId, data.maHocKy, data.tenMon, data.maMon, data.loaiTruMaMonHoc ?? null]
    );

    return ketQua.rows[0] ? anhXaHocPhan(ketQua.rows[0]) : null;
  }

  async tao(data: DuLieuTaoHocPhan, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongHocPhan>(
      `
        WITH inserted AS (
          INSERT INTO mon_hoc (
            ma_hoc_ky,
            ma_mon,
            ten_mon,
            so_tin_chi,
            thoi_gian_tao,
            thoi_gian_cap_nhat
          )
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING *
        )
        ${cauTruyVanHocPhanCoSo.replace("FROM mon_hoc mh", "FROM inserted mh")}
      `,
      [data.maHocKy, data.maMon, data.tenMon, data.soTinChi]
    );

    const monHoc = ketQua.rows[0];

    if (!monHoc) {
      throw new Error("Tao mon hoc that bai");
    }

    return anhXaHocPhan(monHoc);
  }

  async capNhat(
    maMonHoc: string,
    data: DuLieuCapNhatHocPhan,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongHocPhan>(
      `
        WITH updated AS (
          UPDATE mon_hoc
          SET ma_hoc_ky = $2,
              ma_mon = $3,
              ten_mon = $4,
              so_tin_chi = $5,
              thoi_gian_cap_nhat = NOW()
          WHERE ma_mon_hoc = $1
          RETURNING *
        )
        ${cauTruyVanHocPhanCoSo.replace("FROM mon_hoc mh", "FROM updated mh")}
      `,
      [maMonHoc, data.maHocKy, data.maMon, data.tenMon, data.soTinChi]
    );

    return ketQua.rows[0] ? anhXaHocPhan(ketQua.rows[0]) : null;
  }

  async demLienKet(maMonHoc: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongLienKetHocPhan>(
      `
        SELECT
          (SELECT COUNT(*) FROM lich_hoc WHERE ma_mon_hoc = $1)::int AS "lichHoc",
          (SELECT COUNT(*) FROM lich_thi WHERE ma_mon_hoc = $1)::int AS "lichThi",
          (SELECT COUNT(*) FROM deadline WHERE ma_mon_hoc = $1)::int AS "deadline",
          (SELECT COUNT(*) FROM thanh_phan_diem WHERE ma_mon_hoc = $1)::int AS "thanhPhanDiem",
          (SELECT COUNT(*) FROM ghi_chu WHERE ma_mon_hoc = $1)::int AS "ghiChu",
          (SELECT COUNT(*) FROM tai_lieu WHERE ma_mon_hoc = $1 AND trang_thai = 'KHA_DUNG')::int AS "taiLieu",
          (SELECT COUNT(*) FROM bo_flashcard WHERE ma_mon_hoc = $1)::int AS "boFlashcard"
      `,
      [maMonHoc]
    );

    return anhXaLienKet(
      ketQua.rows[0] ?? {
        lichHoc: 0,
        lichThi: 0,
        deadline: 0,
        thanhPhanDiem: 0,
        ghiChu: 0,
        taiLieu: 0,
        boFlashcard: 0
      }
    );
  }

  async xoa(maMonHoc: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan("DELETE FROM mon_hoc WHERE ma_mon_hoc = $1", [maMonHoc]);

    return (ketQua.rowCount ?? 0) > 0;
  }

  async timHoacTaoChoImport(data: DuLieuHocPhanImport, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const monHocDaTonTai = await this.timTrungLap(
      {
        actorId: data.actorId,
        maHocKy: data.maHocKy,
        maMon: data.maMon,
        tenMon: data.tenMon
      },
      boThucThi
    );

    if (monHocDaTonTai) {
      return {
        monHoc: monHocDaTonTai,
        daTao: false
      };
    }

    const monHocMoi = await this.tao(
      {
        maHocKy: data.maHocKy,
        maMon: data.maMon,
        tenMon: data.tenMon,
        soTinChi: chuanHoaSoTinChiImport(data.soTinChi)
      },
      boThucThi
    );

    return {
      monHoc: monHocMoi,
      daTao: true
    };
  }
}
