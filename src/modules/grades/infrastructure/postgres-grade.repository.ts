import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  BoLocBangDiem,
  BoLocMonHocImportDiem,
  KhoDiemSo
} from "../application/ports/grade.repository.js";
import type {
  CauHinhTrongSoDiem,
  DuLieuTaoThanhPhanDiem,
  DuLieuUpsertThanhPhanDiem,
  HocKyDiemSo,
  MonHocDiemSo,
  MucQuyCheHocLuc,
  MucQuyDoiDiem,
  ThanhPhanDiem
} from "../domain/grade.js";

type DongHocKy = {
  maHocKy: string;
  maNguoiDung: string;
  tenHocKy: string;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
};

type DongMonHoc = {
  maMonHoc: string;
  maHocKy: string;
  maNguoiDung: string;
  maMon: string | null;
  tenMon: string;
  soTinChi: number;
  tenHocKy: string;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
  maTruongCode: string | null;
};

type DongThanhPhan = {
  maThanhPhan: string | number;
  maMonHoc: string;
  tenThanhPhan: string;
  trongSo: string | number;
  diem: string | number | null;
  createdAt: Date;
  updatedAt: Date;
};

type DongThanhPhanVaMon = DongThanhPhan & DongMonHoc;

type DongMucQuyDoiDiem = {
  diemTu: string | number;
  diemDen: string | number;
  diemChu: string;
  he4: string | number;
};

type DongQuyCheHocLuc = {
  xepLoai: string;
  gpaTu: string | number;
  gpaDen: string | number;
};

const anhXaHocKy = (row: DongHocKy): HocKyDiemSo => ({
  maHocKy: row.maHocKy,
  maNguoiDung: row.maNguoiDung,
  tenHocKy: row.tenHocKy,
  ngayBatDau: row.ngayBatDau,
  ngayKetThuc: row.ngayKetThuc
});

const anhXaMonHoc = (row: DongMonHoc): MonHocDiemSo => ({
  maMonHoc: row.maMonHoc,
  maHocKy: row.maHocKy,
  maNguoiDung: row.maNguoiDung,
  maMon: row.maMon,
  tenMon: row.tenMon,
  soTinChi: Number(row.soTinChi),
  tenHocKy: row.tenHocKy,
  ngayBatDau: row.ngayBatDau,
  ngayKetThuc: row.ngayKetThuc,
  maTruongCode: row.maTruongCode
});

const anhXaThanhPhan = (row: DongThanhPhan): ThanhPhanDiem => ({
  maThanhPhan: String(row.maThanhPhan),
  maMonHoc: row.maMonHoc,
  tenThanhPhan: row.tenThanhPhan,
  trongSo: Number(row.trongSo),
  diem: row.diem === null ? null : Number(row.diem),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const anhXaMucQuyDoi = (row: DongMucQuyDoiDiem): MucQuyDoiDiem => ({
  diemTu: Number(row.diemTu),
  diemDen: Number(row.diemDen),
  diemChu: row.diemChu,
  he4: Number(row.he4)
});

const anhXaQuyChe = (row: DongQuyCheHocLuc): MucQuyCheHocLuc => ({
  xepLoai: row.xepLoai,
  gpaTu: Number(row.gpaTu),
  gpaDen: Number(row.gpaDen)
});

const cauTruyVanHocKyCoSo = `
  SELECT
    hk.ma_hoc_ky AS "maHocKy",
    hk.ma_nguoi_dung AS "maNguoiDung",
    hk.ten_hoc_ky AS "tenHocKy",
    hk.ngay_bat_dau::text AS "ngayBatDau",
    hk.ngay_ket_thuc::text AS "ngayKetThuc"
  FROM hoc_ky hk
`;

const cauTruyVanMonHocCoSo = `
  SELECT
    mh.ma_mon_hoc AS "maMonHoc",
    mh.ma_hoc_ky AS "maHocKy",
    hk.ma_nguoi_dung AS "maNguoiDung",
    mh.ma_mon AS "maMon",
    mh.ten_mon AS "tenMon",
    mh.so_tin_chi AS "soTinChi",
    hk.ten_hoc_ky AS "tenHocKy",
    hk.ngay_bat_dau::text AS "ngayBatDau",
    hk.ngay_ket_thuc::text AS "ngayKetThuc",
    hsv.ma_truong_code AS "maTruongCode"
  FROM mon_hoc mh
  INNER JOIN hoc_ky hk ON hk.ma_hoc_ky = mh.ma_hoc_ky
  LEFT JOIN ho_so_sinh_vien hsv ON hsv.ma_nguoi_dung = hk.ma_nguoi_dung
`;

const cauTruyVanThanhPhanCoSo = `
  SELECT
    tpd.ma_thanh_phan AS "maThanhPhan",
    tpd.ma_mon_hoc AS "maMonHoc",
    tpd.ten_thanh_phan AS "tenThanhPhan",
    tpd.trong_so AS "trongSo",
    tpd.diem AS "diem",
    tpd.thoi_gian_tao AS "createdAt",
    tpd.thoi_gian_cap_nhat AS "updatedAt"
  FROM thanh_phan_diem tpd
`;

export class KhoDiemSoPostgres implements KhoDiemSo {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async timHocKyCuaSinhVien(maHocKy: string, actorId: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongHocKy>(
      `
        ${cauTruyVanHocKyCoSo}
        WHERE hk.ma_hoc_ky = $1
          AND hk.ma_nguoi_dung = $2
        LIMIT 1
      `,
      [maHocKy, actorId]
    );

    return ketQua.rows[0] ? anhXaHocKy(ketQua.rows[0]) : null;
  }

  async lietKeHocKyCuaSinhVien(actorId: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongHocKy>(
      `
        ${cauTruyVanHocKyCoSo}
        WHERE hk.ma_nguoi_dung = $1
        ORDER BY COALESCE(hk.ngay_bat_dau, hk.thoi_gian_tao::date) DESC, hk.thoi_gian_tao DESC
      `,
      [actorId]
    );

    return ketQua.rows.map(anhXaHocKy);
  }

  async timMonHocCuaSinhVien(maMonHoc: string, actorId: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongMonHoc>(
      `
        ${cauTruyVanMonHocCoSo}
        WHERE mh.ma_mon_hoc = $1
          AND hk.ma_nguoi_dung = $2
        LIMIT 1
      `,
      [maMonHoc, actorId]
    );

    return ketQua.rows[0] ? anhXaMonHoc(ketQua.rows[0]) : null;
  }

  async timThanhPhanCuaSinhVien(
    maThanhPhan: string,
    actorId: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongThanhPhanVaMon>(
      `
        SELECT
          tpd.ma_thanh_phan AS "maThanhPhan",
          tpd.ma_mon_hoc AS "maMonHoc",
          tpd.ten_thanh_phan AS "tenThanhPhan",
          tpd.trong_so AS "trongSo",
          tpd.diem AS "diem",
          tpd.thoi_gian_tao AS "createdAt",
          tpd.thoi_gian_cap_nhat AS "updatedAt",
          mh.ma_hoc_ky AS "maHocKy",
          hk.ma_nguoi_dung AS "maNguoiDung",
          mh.ma_mon AS "maMon",
          mh.ten_mon AS "tenMon",
          mh.so_tin_chi AS "soTinChi",
          hk.ten_hoc_ky AS "tenHocKy",
          hk.ngay_bat_dau::text AS "ngayBatDau",
          hk.ngay_ket_thuc::text AS "ngayKetThuc",
          hsv.ma_truong_code AS "maTruongCode"
        FROM thanh_phan_diem tpd
        INNER JOIN mon_hoc mh ON mh.ma_mon_hoc = tpd.ma_mon_hoc
        INNER JOIN hoc_ky hk ON hk.ma_hoc_ky = mh.ma_hoc_ky
        LEFT JOIN ho_so_sinh_vien hsv ON hsv.ma_nguoi_dung = hk.ma_nguoi_dung
        WHERE tpd.ma_thanh_phan::text = $1
          AND hk.ma_nguoi_dung = $2
        LIMIT 1
      `,
      [maThanhPhan, actorId]
    );

    const row = ketQua.rows[0];

    return row
      ? {
          ...anhXaThanhPhan(row),
          monHoc: anhXaMonHoc(row)
        }
      : null;
  }

  async timThanhPhanTheoTen(maMonHoc: string, tenThanhPhan: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongThanhPhan>(
      `
        ${cauTruyVanThanhPhanCoSo}
        WHERE tpd.ma_mon_hoc = $1
          AND LOWER(TRIM(tpd.ten_thanh_phan)) = LOWER(TRIM($2))
        LIMIT 1
      `,
      [maMonHoc, tenThanhPhan]
    );

    return ketQua.rows[0] ? anhXaThanhPhan(ketQua.rows[0]) : null;
  }

  async lietKeMonHocBangDiem(boLoc: BoLocBangDiem, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const dieuKien = ["hk.ma_nguoi_dung = $1"];
    const thamSo: unknown[] = [boLoc.actorId];

    if (boLoc.maHocKy) {
      thamSo.push(boLoc.maHocKy);
      dieuKien.push(`mh.ma_hoc_ky = $${thamSo.length}`);
    }

    const ketQua = await boThucThi.truyVan<DongMonHoc>(
      `
        ${cauTruyVanMonHocCoSo}
        WHERE ${dieuKien.join(" AND ")}
        ORDER BY COALESCE(hk.ngay_bat_dau, hk.thoi_gian_tao::date) DESC, LOWER(mh.ten_mon) ASC
      `,
      thamSo
    );

    return ketQua.rows.map(anhXaMonHoc);
  }

  async lietKeThanhPhanTheoMon(maMonHoc: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongThanhPhan>(
      `
        ${cauTruyVanThanhPhanCoSo}
        WHERE tpd.ma_mon_hoc = $1
        ORDER BY tpd.thoi_gian_tao ASC, tpd.ten_thanh_phan ASC
      `,
      [maMonHoc]
    );

    return ketQua.rows.map(anhXaThanhPhan);
  }

  async timMonHocChoImport(boLoc: BoLocMonHocImportDiem, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    if (!boLoc.maMonHoc && !boLoc.maMon && !boLoc.tenMon) {
      return [];
    }

    const ketQua = await boThucThi.truyVan<DongMonHoc>(
      `
        ${cauTruyVanMonHocCoSo}
        WHERE hk.ma_nguoi_dung = $1
          AND mh.ma_hoc_ky = $2
          AND (
            ($3::uuid IS NOT NULL AND mh.ma_mon_hoc = $3)
            OR ($4::text IS NOT NULL AND mh.ma_mon IS NOT NULL AND LOWER(TRIM(mh.ma_mon)) = LOWER(TRIM($4)))
            OR ($5::text IS NOT NULL AND LOWER(TRIM(mh.ten_mon)) = LOWER(TRIM($5)))
          )
        ORDER BY mh.thoi_gian_tao DESC
      `,
      [boLoc.actorId, boLoc.maHocKy, boLoc.maMonHoc ?? null, boLoc.maMon ?? null, boLoc.tenMon ?? null]
    );

    return ketQua.rows.map(anhXaMonHoc);
  }

  async taoThanhPhan(data: DuLieuTaoThanhPhanDiem, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongThanhPhan>(
      `
        INSERT INTO thanh_phan_diem (
          ma_mon_hoc,
          ten_thanh_phan,
          trong_so,
          diem,
          thoi_gian_tao,
          thoi_gian_cap_nhat
        )
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING
          ma_thanh_phan AS "maThanhPhan",
          ma_mon_hoc AS "maMonHoc",
          ten_thanh_phan AS "tenThanhPhan",
          trong_so AS "trongSo",
          diem AS "diem",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt"
      `,
      [data.maMonHoc, data.tenThanhPhan, data.trongSo, data.diem]
    );

    const thanhPhan = ketQua.rows[0];

    if (!thanhPhan) {
      throw new Error("Tao thanh phan diem that bai");
    }

    return anhXaThanhPhan(thanhPhan);
  }

  async capNhatDiem(maThanhPhan: string, diem: number, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongThanhPhan>(
      `
        UPDATE thanh_phan_diem
        SET diem = $2,
            thoi_gian_cap_nhat = NOW()
        WHERE ma_thanh_phan::text = $1
        RETURNING
          ma_thanh_phan AS "maThanhPhan",
          ma_mon_hoc AS "maMonHoc",
          ten_thanh_phan AS "tenThanhPhan",
          trong_so AS "trongSo",
          diem AS "diem",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt"
      `,
      [maThanhPhan, diem]
    );

    return ketQua.rows[0] ? anhXaThanhPhan(ketQua.rows[0]) : null;
  }

  async thayTheCauHinhTrongSo(
    maMonHoc: string,
    cauHinh: CauHinhTrongSoDiem[],
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const tenThanhPhanGiuLai = cauHinh.map((item) => item.tenThanhPhan.trim().toLowerCase());

    for (const item of cauHinh) {
      const hienTai = await this.timThanhPhanTheoTen(maMonHoc, item.tenThanhPhan, boThucThi);

      await this.upsertThanhPhan(
        {
          maMonHoc,
          tenThanhPhan: item.tenThanhPhan,
          trongSo: item.trongSo,
          diem: item.diem === undefined ? hienTai?.diem ?? null : item.diem
        },
        boThucThi
      );
    }

    if (tenThanhPhanGiuLai.length > 0) {
      await boThucThi.truyVan(
        `
          DELETE FROM thanh_phan_diem
          WHERE ma_mon_hoc = $1
            AND NOT (LOWER(TRIM(ten_thanh_phan)) = ANY($2::text[]))
        `,
        [maMonHoc, tenThanhPhanGiuLai]
      );
    }

    return this.lietKeThanhPhanTheoMon(maMonHoc, boThucThi);
  }

  async upsertThanhPhan(data: DuLieuUpsertThanhPhanDiem, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongThanhPhan>(
      `
        INSERT INTO thanh_phan_diem (
          ma_mon_hoc,
          ten_thanh_phan,
          trong_so,
          diem,
          thoi_gian_tao,
          thoi_gian_cap_nhat
        )
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (ma_mon_hoc, ten_thanh_phan)
        DO UPDATE SET
          trong_so = EXCLUDED.trong_so,
          diem = EXCLUDED.diem,
          thoi_gian_cap_nhat = NOW()
        RETURNING
          ma_thanh_phan AS "maThanhPhan",
          ma_mon_hoc AS "maMonHoc",
          ten_thanh_phan AS "tenThanhPhan",
          trong_so AS "trongSo",
          diem AS "diem",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt"
      `,
      [data.maMonHoc, data.tenThanhPhan, data.trongSo, data.diem]
    );

    const thanhPhan = ketQua.rows[0];

    if (!thanhPhan) {
      throw new Error("Upsert thanh phan diem that bai");
    }

    return anhXaThanhPhan(thanhPhan);
  }

  async layMaTruongCodeSinhVien(actorId: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<{ maTruongCode: string | null }>(
      `
        SELECT hsv.ma_truong_code AS "maTruongCode"
        FROM ho_so_sinh_vien hsv
        WHERE hsv.ma_nguoi_dung = $1
        LIMIT 1
      `,
      [actorId]
    );

    return ketQua.rows[0]?.maTruongCode ?? null;
  }

  async layThangDiem(maTruongCode: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongMucQuyDoiDiem>(
      `
        SELECT
          ct.diem_tu AS "diemTu",
          ct.diem_den AS "diemDen",
          td.diem_chu AS "diemChu",
          td.he_4 AS "he4"
        FROM thang_diem td
        INNER JOIN chi_tiet_thang_diem ct ON ct.ma_thang_diem = td.ma_thang_diem
        WHERE td.ma_truong_code = $1
        ORDER BY ct.diem_tu ASC
      `,
      [maTruongCode]
    );

    return ketQua.rows.map(anhXaMucQuyDoi);
  }

  async layQuyCheHocLuc(maTruongCode: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongQuyCheHocLuc>(
      `
        SELECT
          qchl.xep_loai AS "xepLoai",
          qchl.gpa_tu AS "gpaTu",
          qchl.gpa_den AS "gpaDen"
        FROM quy_che_hoc_luc qchl
        WHERE qchl.ma_truong_code = $1
        ORDER BY qchl.gpa_tu ASC
      `,
      [maTruongCode]
    );

    return ketQua.rows.map(anhXaQuyChe);
  }
}

