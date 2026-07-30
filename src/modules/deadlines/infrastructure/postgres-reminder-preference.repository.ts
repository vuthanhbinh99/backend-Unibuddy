import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type { KhoTuyChinhNhacNho } from "../application/ports/reminder-preference.repository.js";

const TEN_COT = "so_gio_nhac_deadline";

/**
 * Lưu tùy chỉnh nhắc nhở deadline trên bảng `nguoi_dung`, cột `so_gio_nhac_deadline`.
 *
 * Cột được phát hiện động (giống các repo thông báo) để tránh vỡ ứng dụng khi
 * migration chưa được chạy: nếu chưa có cột, coi như người dùng dùng mốc mặc định.
 */
export class KhoTuyChinhNhacNhoPostgres implements KhoTuyChinhNhacNho {
  private coCot?: boolean;

  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async layTheoNguoiDung(
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ): Promise<number | null> {
    if (!(await this.coCotTuyChinh(boThucThi))) {
      return null;
    }

    const ketQua = await boThucThi.truyVan<{ soGio: number | null }>(
      `SELECT ${TEN_COT} AS "soGio" FROM nguoi_dung WHERE ma_nguoi_dung = $1::uuid LIMIT 1`,
      [maNguoiDung]
    );

    const soGio = ketQua.rows[0]?.soGio;
    return soGio === null || soGio === undefined ? null : Number(soGio);
  }

  async capNhat(
    maNguoiDung: string,
    soGioTruocHan: number | null,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ): Promise<void> {
    if (!(await this.coCotTuyChinh(boThucThi))) {
      throw new Error(`Bang nguoi_dung chua co cot ${TEN_COT}`);
    }

    await boThucThi.truyVan(
      `UPDATE nguoi_dung SET ${TEN_COT} = $2 WHERE ma_nguoi_dung = $1::uuid`,
      [maNguoiDung, soGioTruocHan]
    );
  }

  private async coCotTuyChinh(boThucThi: BoThucThiTruyVan) {
    if (this.coCot !== undefined) {
      return this.coCot;
    }

    const ketQua = await boThucThi.truyVan<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'nguoi_dung'
            AND column_name = $1
        ) AS "exists"
      `,
      [TEN_COT]
    );

    this.coCot = ketQua.rows[0]?.exists ?? false;
    return this.coCot;
  }
}
