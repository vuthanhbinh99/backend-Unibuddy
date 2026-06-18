import { v7 as uuidv7 } from "uuid";
import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  CauHinhHocThuatTruongHoc,
  MucThangDiem,
  MucThangDiemNhap,
  QuyCheHocLuc,
  QuyCheHocLucNhap
} from "../domain/academic-rules.js";
import type { KhoHocThuatTruongHoc } from "../application/ports/academic-rules.repository.js";

type DongMucThangDiem = {
  maThangDiem: string;
  maTruongCode: string;
  thuTu: number;
  diemTu: number;
  diemDen: number;
  diemChu: string;
  he4: number;
  createdAt: Date;
  updatedAt: Date;
};

type DongQuyCheHocLuc = {
  maQuyCheHocLuc: string;
  maTruongCode: string;
  thuTu: number;
  xepLoai: string;
  gpaTu: number;
  gpaDen: number;
  createdAt: Date;
  updatedAt: Date;
};

const mapThangDiem = (row: DongMucThangDiem): MucThangDiem => ({
  maThangDiem: row.maThangDiem,
  maTruongCode: row.maTruongCode,
  thuTu: row.thuTu,
  diemTu: row.diemTu,
  diemDen: row.diemDen,
  diemChu: row.diemChu,
  he4: row.he4,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const mapQuyCheHocLuc = (row: DongQuyCheHocLuc): QuyCheHocLuc => ({
  maQuyCheHocLuc: row.maQuyCheHocLuc,
  maTruongCode: row.maTruongCode,
  thuTu: row.thuTu,
  xepLoai: row.xepLoai,
  gpaTu: row.gpaTu,
  gpaDen: row.gpaDen,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

export class KhoHocThuatTruongHocPostgres implements KhoHocThuatTruongHoc {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async layCauHinh(maTruongCode: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu): Promise<CauHinhHocThuatTruongHoc> {
    const thangDiemKetQua = await boThucThi.truyVan<DongMucThangDiem>(
      `
        SELECT
          td.ma_thang_diem AS "maThangDiem",
          td.ma_truong_code AS "maTruongCode",
          td.thu_tu AS "thuTu",
          ct.diem_tu AS "diemTu",
          ct.diem_den AS "diemDen",
          td.diem_chu AS "diemChu",
          td.he_4 AS "he4",
          td.thoi_gian_tao AS "createdAt",
          td.thoi_gian_cap_nhat AS "updatedAt"
        FROM thang_diem td
        INNER JOIN chi_tiet_thang_diem ct ON ct.ma_thang_diem = td.ma_thang_diem
        WHERE td.ma_truong_code = $1
        ORDER BY td.thu_tu ASC, ct.diem_tu ASC
      `,
      [maTruongCode]
    );

    const quyCheKetQua = await boThucThi.truyVan<DongQuyCheHocLuc>(
      `
        SELECT
          qchl.ma_quy_che_hoc_luc AS "maQuyCheHocLuc",
          qchl.ma_truong_code AS "maTruongCode",
          qchl.thu_tu AS "thuTu",
          qchl.xep_loai AS "xepLoai",
          qchl.gpa_tu AS "gpaTu",
          qchl.gpa_den AS "gpaDen",
          qchl.thoi_gian_tao AS "createdAt",
          qchl.thoi_gian_cap_nhat AS "updatedAt"
        FROM quy_che_hoc_luc qchl
        WHERE qchl.ma_truong_code = $1
        ORDER BY qchl.thu_tu ASC, qchl.gpa_tu ASC
      `,
      [maTruongCode]
    );

    return {
      maTruongCode,
      mucThangDiem: thangDiemKetQua.rows.map(mapThangDiem),
      quyCheHocLuc: quyCheKetQua.rows.map(mapQuyCheHocLuc)
    };
  }

  async capNhatThangDiem(
    maTruongCode: string,
    mucThangDiem: MucThangDiemNhap[],
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    await boThucThi.truyVan(`DELETE FROM chi_tiet_thang_diem WHERE ma_truong_code = $1`, [maTruongCode]);
    await boThucThi.truyVan(`DELETE FROM thang_diem WHERE ma_truong_code = $1`, [maTruongCode]);

    for (const muc of mucThangDiem) {
      const maThangDiem = uuidv7();

      await boThucThi.truyVan(
        `
          INSERT INTO thang_diem (
            ma_thang_diem,
            ma_truong_code,
            thu_tu,
            diem_chu,
            he_4,
            thoi_gian_tao,
            thoi_gian_cap_nhat
          )
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `,
        [maThangDiem, maTruongCode, muc.thuTu, muc.diemChu, muc.he4]
      );

      await boThucThi.truyVan(
        `
          INSERT INTO chi_tiet_thang_diem (
            ma_chi_tiet_thang_diem,
            ma_truong_code,
            ma_thang_diem,
            diem_tu,
            diem_den,
            thoi_gian_tao,
            thoi_gian_cap_nhat
          )
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `,
        [uuidv7(), maTruongCode, maThangDiem, muc.diemTu, muc.diemDen]
      );
    }
  }

  async capNhatQuyCheHocLuc(
    maTruongCode: string,
    quyCheHocLuc: QuyCheHocLucNhap[],
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    await boThucThi.truyVan(`DELETE FROM quy_che_hoc_luc WHERE ma_truong_code = $1`, [maTruongCode]);

    for (const muc of quyCheHocLuc) {
      await boThucThi.truyVan(
        `
          INSERT INTO quy_che_hoc_luc (
            ma_quy_che_hoc_luc,
            ma_truong_code,
            thu_tu,
            xep_loai,
            gpa_tu,
            gpa_den,
            thoi_gian_tao,
            thoi_gian_cap_nhat
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `,
        [uuidv7(), maTruongCode, muc.thuTu, muc.xepLoai, muc.gpaTu, muc.gpaDen]
      );
    }
  }
}
