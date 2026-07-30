import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import { LoiUngDung } from "../../../shared/errors/app-error.js";
import type {
  CauHinhHocThuatTruongHoc,
  MucThangDiem,
  MucThangDiemNhap,
  QuyCheHocLuc,
  QuyCheHocLucNhap
} from "../domain/academic-rules.js";
import type { KhoHocThuatTruongHoc } from "../application/ports/academic-rules.repository.js";

const TEN_THANG_DIEM_MAC_DINH = "Thang điểm chữ";

type DongThangDiem = {
  maThangDiem: number;
  tenThangDiem: string;
};

type DongMucThangDiem = {
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

type DongMaTruong = {
  maTruong: number;
};

const soTuText = (value: string | number): number =>
  typeof value === "number" ? value : Number(value);

const mapThangDiem = (row: DongMucThangDiem): MucThangDiem => ({
  diemTu: soTuText(row.diemTu),
  diemDen: soTuText(row.diemDen),
  diemChu: row.diemChu,
  he4: soTuText(row.he4)
});

const mapQuyCheHocLuc = (row: DongQuyCheHocLuc): QuyCheHocLuc => ({
  xepLoai: row.xepLoai,
  gpaTu: soTuText(row.gpaTu),
  gpaDen: soTuText(row.gpaDen)
});

export class KhoHocThuatTruongHocPostgres implements KhoHocThuatTruongHoc {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  private async timMaTruong(
    maTruongCode: string,
    boThucThi: BoThucThiTruyVan
  ): Promise<number> {
    const ketQua = await boThucThi.truyVan<DongMaTruong>(
      `SELECT ma_truong AS "maTruong" FROM truong_hoc WHERE ma_truong_code = $1 LIMIT 1`,
      [maTruongCode]
    );

    const maTruong = ketQua.rows[0]?.maTruong;

    if (maTruong == null) {
      throw LoiUngDung.khongTimThay("Không tìm thấy trường học");
    }

    return maTruong;
  }

  async layCauHinh(
    maTruongCode: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ): Promise<CauHinhHocThuatTruongHoc> {
    const thangDiemKetQua = await boThucThi.truyVan<DongThangDiem>(
      `
        SELECT
          td.ma_thang_diem AS "maThangDiem",
          td.ten_thang_diem AS "tenThangDiem"
        FROM thang_diem td
        INNER JOIN truong_hoc th ON th.ma_truong = td.ma_truong
        WHERE th.ma_truong_code = $1
        ORDER BY td.ma_thang_diem ASC
        LIMIT 1
      `,
      [maTruongCode]
    );

    const thangDiem = thangDiemKetQua.rows[0] ?? null;

    const mucThangDiemKetQua = await boThucThi.truyVan<DongMucThangDiem>(
      `
        SELECT
          ct.diem_thap_nhat AS "diemTu",
          ct.diem_cao_nhat AS "diemDen",
          ct.diem_chu AS "diemChu",
          ct.diem_he_4 AS "he4"
        FROM chi_tiet_thang_diem ct
        INNER JOIN thang_diem td ON td.ma_thang_diem = ct.ma_thang_diem
        INNER JOIN truong_hoc th ON th.ma_truong = td.ma_truong
        WHERE th.ma_truong_code = $1
        ORDER BY ct.diem_thap_nhat ASC
      `,
      [maTruongCode]
    );

    const quyCheKetQua = await boThucThi.truyVan<DongQuyCheHocLuc>(
      `
        SELECT
          qchl.ten_xep_loai AS "xepLoai",
          qchl.gpa_toi_thieu AS "gpaTu",
          qchl.gpa_toi_da AS "gpaDen"
        FROM quy_che_hoc_luc qchl
        INNER JOIN truong_hoc th ON th.ma_truong = qchl.ma_truong
        WHERE th.ma_truong_code = $1
        ORDER BY qchl.gpa_toi_thieu ASC
      `,
      [maTruongCode]
    );

    return {
      maTruongCode,
      tenThangDiem: thangDiem?.tenThangDiem ?? null,
      mucThangDiem: mucThangDiemKetQua.rows.map(mapThangDiem),
      quyCheHocLuc: quyCheKetQua.rows.map(mapQuyCheHocLuc)
    };
  }

  async capNhatThangDiem(
    maTruongCode: string,
    mucThangDiem: MucThangDiemNhap[],
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ): Promise<void> {
    const maTruong = await this.timMaTruong(maTruongCode, boThucThi);

    const thangDiemHienTai = await boThucThi.truyVan<{ maThangDiem: number; tenThangDiem: string }>(
      `
        SELECT ma_thang_diem AS "maThangDiem", ten_thang_diem AS "tenThangDiem"
        FROM thang_diem
        WHERE ma_truong = $1
        ORDER BY ma_thang_diem ASC
        LIMIT 1
      `,
      [maTruong]
    );

    let maThangDiem = thangDiemHienTai.rows[0]?.maThangDiem ?? null;

    const diemThapNhat = Math.min(...mucThangDiem.map((muc) => muc.diemTu));
    const diemCaoNhat = Math.max(...mucThangDiem.map((muc) => muc.diemDen));

    if (maThangDiem == null) {
      const themMoi = await boThucThi.truyVan<{ maThangDiem: number }>(
        `
          INSERT INTO thang_diem (
            ma_truong,
            ten_thang_diem,
            diem_thap_nhat,
            diem_cao_nhat,
            thoi_gian_tao,
            thoi_gian_cap_nhat
          )
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING ma_thang_diem AS "maThangDiem"
        `,
        [maTruong, TEN_THANG_DIEM_MAC_DINH, diemThapNhat, diemCaoNhat]
      );

      maThangDiem = themMoi.rows[0].maThangDiem;
    } else {
      await boThucThi.truyVan(
        `
          UPDATE thang_diem
          SET diem_thap_nhat = $2,
              diem_cao_nhat = $3,
              thoi_gian_cap_nhat = NOW()
          WHERE ma_thang_diem = $1
        `,
        [maThangDiem, diemThapNhat, diemCaoNhat]
      );

      await boThucThi.truyVan(`DELETE FROM chi_tiet_thang_diem WHERE ma_thang_diem = $1`, [maThangDiem]);
    }

    for (const muc of mucThangDiem) {
      await boThucThi.truyVan(
        `
          INSERT INTO chi_tiet_thang_diem (
            ma_thang_diem,
            diem_chu,
            diem_he_4,
            diem_thap_nhat,
            diem_cao_nhat
          )
          VALUES ($1, $2, $3, $4, $5)
        `,
        [maThangDiem, muc.diemChu, muc.he4, muc.diemTu, muc.diemDen]
      );
    }
  }

  async capNhatQuyCheHocLuc(
    maTruongCode: string,
    quyCheHocLuc: QuyCheHocLucNhap[],
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ): Promise<void> {
    const maTruong = await this.timMaTruong(maTruongCode, boThucThi);

    await boThucThi.truyVan(`DELETE FROM quy_che_hoc_luc WHERE ma_truong = $1`, [maTruong]);

    for (const muc of quyCheHocLuc) {
      await boThucThi.truyVan(
        `
          INSERT INTO quy_che_hoc_luc (
            ma_truong,
            ten_xep_loai,
            gpa_toi_thieu,
            gpa_toi_da
          )
          VALUES ($1, $2, $3, $4)
        `,
        [maTruong, muc.xepLoai, muc.gpaTu, muc.gpaDen]
      );
    }
  }
}
