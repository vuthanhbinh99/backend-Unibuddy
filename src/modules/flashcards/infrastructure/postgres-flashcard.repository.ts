import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  BoLocDanhSachBoFlashcard,
  KhoFlashcard
} from "../application/ports/flashcard.repository.js";
import type {
  BoFlashcard,
  DuLieuCapNhatBoFlashcard,
  DuLieuCapNhatTheFlashcard,
  DuLieuCapNhatTienDoFlashcard,
  DuLieuTaoBoFlashcard,
  DuLieuTaoTheFlashcard,
  MonHocFlashcard,
  TheFlashcard,
  ThongKeFlashcard
} from "../domain/flashcard.js";

type DongBoFlashcard = {
  maBo: string;
  maNguoiDung: string;
  maMonHoc: string | null;
  maMon: string | null;
  tenMon: string | null;
  tenBo: string;
  soThe: string | number;
  soTheCanOn: string | number;
  createdAt: Date;
  updatedAt: Date;
};

type DongTheFlashcard = {
  maFlashcard: string;
  maBo: string;
  maNguoiDung: string;
  matTruoc: string;
  matSau: string;
  soLanOn: number;
  diemGhiNho: number;
  thoiGianLanOnCuoi: Date | null;
  thoiGianLanOnTiepTheo: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type DongMonHocFlashcard = {
  maMonHoc: string;
  maNguoiDung: string;
  maHocKy: string;
  maMon: string | null;
  tenMon: string;
};

type DongThongKeFlashcard = {
  tongSoBo: string | number;
  tongSoThe: string | number;
  soTheCanOnHomNay: string | number;
  soTheChuaOn: string | number;
  soTheDaThuoc: string | number;
};

const anhXaBo = (row: DongBoFlashcard): BoFlashcard => ({
  maBo: row.maBo,
  maNguoiDung: row.maNguoiDung,
  maMonHoc: row.maMonHoc,
  maMon: row.maMon,
  tenMon: row.tenMon,
  tenBo: row.tenBo,
  soThe: Number(row.soThe),
  soTheCanOn: Number(row.soTheCanOn),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const anhXaThe = (row: DongTheFlashcard): TheFlashcard => ({
  maFlashcard: row.maFlashcard,
  maBo: row.maBo,
  maNguoiDung: row.maNguoiDung,
  matTruoc: row.matTruoc,
  matSau: row.matSau,
  soLanOn: Number(row.soLanOn),
  diemGhiNho: Number(row.diemGhiNho),
  thoiGianLanOnCuoi: row.thoiGianLanOnCuoi,
  thoiGianLanOnTiepTheo: row.thoiGianLanOnTiepTheo,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const anhXaMonHoc = (row: DongMonHocFlashcard): MonHocFlashcard => ({
  maMonHoc: row.maMonHoc,
  maNguoiDung: row.maNguoiDung,
  maHocKy: row.maHocKy,
  maMon: row.maMon,
  tenMon: row.tenMon
});

const cauTruyVanBoCoSo = `
  SELECT
    bf.ma_bo AS "maBo",
    bf.ma_nguoi_dung AS "maNguoiDung",
    bf.ma_mon_hoc AS "maMonHoc",
    mh.ma_mon AS "maMon",
    mh.ten_mon AS "tenMon",
    bf.ten_bo AS "tenBo",
    COUNT(fc.ma_flashcard)::int AS "soThe",
    COUNT(fc.ma_flashcard) FILTER (
      WHERE fc.thoi_gian_lan_on_tiep_theo IS NULL
         OR fc.thoi_gian_lan_on_tiep_theo <= NOW()
    )::int AS "soTheCanOn",
    bf.thoi_gian_tao AS "createdAt",
    bf.thoi_gian_cap_nhat AS "updatedAt"
  FROM bo_flashcard bf
  LEFT JOIN mon_hoc mh ON mh.ma_mon_hoc = bf.ma_mon_hoc
  LEFT JOIN flashcard fc ON fc.ma_bo = bf.ma_bo
`;

const nhomCotBo = `
  GROUP BY
    bf.ma_bo,
    bf.ma_nguoi_dung,
    bf.ma_mon_hoc,
    mh.ma_mon,
    mh.ten_mon,
    bf.ten_bo,
    bf.thoi_gian_tao,
    bf.thoi_gian_cap_nhat
`;

const cauTruyVanTheCoSo = `
  SELECT
    fc.ma_flashcard AS "maFlashcard",
    fc.ma_bo AS "maBo",
    bf.ma_nguoi_dung AS "maNguoiDung",
    fc.mat_truoc AS "matTruoc",
    fc.mat_sau AS "matSau",
    fc.so_lan_on AS "soLanOn",
    fc.diem_ghi_nho::float8 AS "diemGhiNho",
    fc.thoi_gian_lan_on_cuoi AS "thoiGianLanOnCuoi",
    fc.thoi_gian_lan_on_tiep_theo AS "thoiGianLanOnTiepTheo",
    fc.thoi_gian_tao AS "createdAt",
    fc.thoi_gian_cap_nhat AS "updatedAt"
  FROM flashcard fc
  INNER JOIN bo_flashcard bf ON bf.ma_bo = fc.ma_bo
`;

export class KhoFlashcardPostgres implements KhoFlashcard {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async timMonHocCuaSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongMonHocFlashcard>(
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

  async lietKeBoCuaSinhVien(
    boLoc: BoLocDanhSachBoFlashcard,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const dieuKien = ["bf.ma_nguoi_dung = $1"];
    const thamSo: unknown[] = [boLoc.actorId];

    if (boLoc.maMonHoc) {
      thamSo.push(boLoc.maMonHoc);
      dieuKien.push(`bf.ma_mon_hoc = $${thamSo.length}`);
    }

    const ketQua = await boThucThi.truyVan<DongBoFlashcard>(
      `
        ${cauTruyVanBoCoSo}
        WHERE ${dieuKien.join(" AND ")}
        ${nhomCotBo}
        ORDER BY bf.thoi_gian_cap_nhat DESC, bf.thoi_gian_tao DESC
      `,
      thamSo
    );

    return ketQua.rows.map(anhXaBo);
  }

  async timBoCuaSinhVien(maBo: string, maNguoiDung: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongBoFlashcard>(
      `
        ${cauTruyVanBoCoSo}
        WHERE bf.ma_bo = $1
          AND bf.ma_nguoi_dung = $2
        ${nhomCotBo}
        LIMIT 1
      `,
      [maBo, maNguoiDung]
    );

    return ketQua.rows[0] ? anhXaBo(ketQua.rows[0]) : null;
  }

  async taoBo(data: DuLieuTaoBoFlashcard, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongBoFlashcard>(
      `
        WITH inserted AS (
          INSERT INTO bo_flashcard (
            ma_nguoi_dung,
            ma_mon_hoc,
            ten_bo,
            thoi_gian_tao,
            thoi_gian_cap_nhat
          )
          VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING *
        )
        ${cauTruyVanBoCoSo.replace("FROM bo_flashcard bf", "FROM inserted bf")}
        ${nhomCotBo}
      `,
      [data.maNguoiDung, data.maMonHoc, data.tenBo]
    );

    const bo = ketQua.rows[0];

    if (!bo) {
      throw new Error("Tao bo flashcard that bai");
    }

    return anhXaBo(bo);
  }

  async capNhatBo(data: DuLieuCapNhatBoFlashcard, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongBoFlashcard>(
      `
        WITH updated AS (
          UPDATE bo_flashcard
          SET ten_bo = $2,
              thoi_gian_cap_nhat = NOW()
          WHERE ma_bo = $1
          RETURNING *
        )
        ${cauTruyVanBoCoSo.replace("FROM bo_flashcard bf", "FROM updated bf")}
        ${nhomCotBo}
      `,
      [data.maBo, data.tenBo]
    );

    return ketQua.rows[0] ? anhXaBo(ketQua.rows[0]) : null;
  }

  async xoaBo(maBo: string, maNguoiDung: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan("DELETE FROM bo_flashcard WHERE ma_bo = $1 AND ma_nguoi_dung = $2", [
      maBo,
      maNguoiDung
    ]);

    return (ketQua.rowCount ?? 0) > 0;
  }

  async taoThe(data: DuLieuTaoTheFlashcard, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongTheFlashcard>(
      `
        WITH inserted AS (
          INSERT INTO flashcard (
            ma_bo,
            mat_truoc,
            mat_sau,
            so_lan_on,
            diem_ghi_nho,
            thoi_gian_lan_on_cuoi,
            thoi_gian_lan_on_tiep_theo,
            thoi_gian_tao,
            thoi_gian_cap_nhat
          )
          VALUES ($1, $2, $3, 0, 2.50, NULL, NOW(), NOW(), NOW())
          RETURNING *
        )
        ${cauTruyVanTheCoSo.replace("FROM flashcard fc", "FROM inserted fc")}
      `,
      [data.maBo, data.matTruoc, data.matSau]
    );

    const the = ketQua.rows[0];

    if (!the) {
      throw new Error("Tao the flashcard that bai");
    }

    return anhXaThe(the);
  }

  async taoNhieuThe(data: DuLieuTaoTheFlashcard[], boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    if (data.length === 0) {
      return [];
    }

    const maBo = data[0].maBo;
    const ketQua = await boThucThi.truyVan<DongTheFlashcard>(
      `
        WITH inserted AS (
          INSERT INTO flashcard (
            ma_bo,
            mat_truoc,
            mat_sau,
            so_lan_on,
            diem_ghi_nho,
            thoi_gian_lan_on_cuoi,
            thoi_gian_lan_on_tiep_theo,
            thoi_gian_tao,
            thoi_gian_cap_nhat
          )
          SELECT
            $1,
            du_lieu.mat_truoc,
            du_lieu.mat_sau,
            0,
            2.50,
            NULL,
            NOW(),
            NOW(),
            NOW()
          FROM unnest($2::text[], $3::text[]) AS du_lieu(mat_truoc, mat_sau)
          RETURNING *
        )
        ${cauTruyVanTheCoSo.replace("FROM flashcard fc", "FROM inserted fc")}
        ORDER BY fc.thoi_gian_tao ASC
      `,
      [maBo, data.map((item) => item.matTruoc), data.map((item) => item.matSau)]
    );

    return ketQua.rows.map(anhXaThe);
  }

  async timTheCuaSinhVien(
    maFlashcard: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongTheFlashcard>(
      `
        ${cauTruyVanTheCoSo}
        WHERE fc.ma_flashcard = $1
          AND bf.ma_nguoi_dung = $2
        LIMIT 1
      `,
      [maFlashcard, maNguoiDung]
    );

    return ketQua.rows[0] ? anhXaThe(ketQua.rows[0]) : null;
  }

  async capNhatThe(data: DuLieuCapNhatTheFlashcard, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongTheFlashcard>(
      `
        WITH updated AS (
          UPDATE flashcard
          SET mat_truoc = $2,
              mat_sau = $3,
              thoi_gian_cap_nhat = NOW()
          WHERE ma_flashcard = $1
          RETURNING *
        )
        ${cauTruyVanTheCoSo.replace("FROM flashcard fc", "FROM updated fc")}
      `,
      [data.maFlashcard, data.matTruoc, data.matSau]
    );

    return ketQua.rows[0] ? anhXaThe(ketQua.rows[0]) : null;
  }

  async xoaThe(maFlashcard: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan("DELETE FROM flashcard WHERE ma_flashcard = $1", [maFlashcard]);

    return (ketQua.rowCount ?? 0) > 0;
  }

  async lietKeTheCanOn(maBo: string, maNguoiDung: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongTheFlashcard>(
      `
        ${cauTruyVanTheCoSo}
        WHERE fc.ma_bo = $1
          AND bf.ma_nguoi_dung = $2
          AND (fc.thoi_gian_lan_on_tiep_theo IS NULL OR fc.thoi_gian_lan_on_tiep_theo <= NOW())
        ORDER BY fc.thoi_gian_lan_on_tiep_theo ASC NULLS FIRST, fc.thoi_gian_tao ASC
      `,
      [maBo, maNguoiDung]
    );

    return ketQua.rows.map(anhXaThe);
  }

  async capNhatTienDo(data: DuLieuCapNhatTienDoFlashcard, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongTheFlashcard>(
      `
        WITH updated AS (
          UPDATE flashcard
          SET so_lan_on = $2,
              diem_ghi_nho = $3,
              thoi_gian_lan_on_cuoi = $4,
              thoi_gian_lan_on_tiep_theo = $5,
              thoi_gian_cap_nhat = NOW()
          WHERE ma_flashcard = $1
          RETURNING *
        )
        ${cauTruyVanTheCoSo.replace("FROM flashcard fc", "FROM updated fc")}
      `,
      [
        data.maFlashcard,
        data.soLanOn,
        data.diemGhiNho,
        data.thoiGianLanOnCuoi.toISOString(),
        data.thoiGianLanOnTiepTheo.toISOString()
      ]
    );

    return ketQua.rows[0] ? anhXaThe(ketQua.rows[0]) : null;
  }

  async layThongKe(maNguoiDung: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu): Promise<ThongKeFlashcard> {
    const ketQua = await boThucThi.truyVan<DongThongKeFlashcard>(
      `
        SELECT
          COUNT(DISTINCT bf.ma_bo)::int AS "tongSoBo",
          COUNT(fc.ma_flashcard)::int AS "tongSoThe",
          COUNT(fc.ma_flashcard) FILTER (
            WHERE fc.thoi_gian_lan_on_tiep_theo IS NULL
               OR fc.thoi_gian_lan_on_tiep_theo <= NOW()
          )::int AS "soTheCanOnHomNay",
          COUNT(fc.ma_flashcard) FILTER (WHERE fc.so_lan_on = 0)::int AS "soTheChuaOn",
          COUNT(fc.ma_flashcard) FILTER (
            WHERE fc.so_lan_on >= 3
              AND fc.diem_ghi_nho >= 2.50
          )::int AS "soTheDaThuoc"
        FROM bo_flashcard bf
        LEFT JOIN flashcard fc ON fc.ma_bo = bf.ma_bo
        WHERE bf.ma_nguoi_dung = $1
      `,
      [maNguoiDung]
    );

    const row = ketQua.rows[0] ?? {
      tongSoBo: 0,
      tongSoThe: 0,
      soTheCanOnHomNay: 0,
      soTheChuaOn: 0,
      soTheDaThuoc: 0
    };
    const tongSoThe = Number(row.tongSoThe);
    const soTheDaThuoc = Number(row.soTheDaThuoc);

    return {
      tongSoBo: Number(row.tongSoBo),
      tongSoThe,
      soTheCanOnHomNay: Number(row.soTheCanOnHomNay),
      soTheChuaOn: Number(row.soTheChuaOn),
      soTheDaThuoc,
      tyLeThuocBai: tongSoThe > 0 ? Number(((soTheDaThuoc / tongSoThe) * 100).toFixed(2)) : 0
    };
  }
}
