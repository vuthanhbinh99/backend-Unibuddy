import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type { KhoTuyChinhThongBaoDay } from "../application/ports/notification-preference.repository.js";

const TEN_COT = "nhan_thong_bao_day";

/**
 * Lưu tùy chọn nhận thông báo đẩy trên bảng `nguoi_dung`, cột `nhan_thong_bao_day`.
 *
 * Cột được phát hiện động (giống các repo thông báo khác) để tránh vỡ ứng dụng
 * khi migration chưa được chạy: nếu chưa có cột, coi như mọi người dùng đang bật
 * nhận thông báo và endpoint cập nhật sẽ báo lỗi cấu hình.
 */
export class KhoTuyChinhThongBaoDayPostgres implements KhoTuyChinhThongBaoDay {
  private coCot?: boolean;

  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async layTheoNguoiDung(
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ): Promise<boolean> {
    if (!(await this.coCotTuyChinh(boThucThi))) {
      return true;
    }

    const ketQua = await boThucThi.truyVan<{ nhan: boolean | null }>(
      `SELECT ${TEN_COT} AS "nhan" FROM nguoi_dung WHERE ma_nguoi_dung = $1::uuid LIMIT 1`,
      [maNguoiDung]
    );

    const nhan = ketQua.rows[0]?.nhan;
    return nhan === null || nhan === undefined ? true : Boolean(nhan);
  }

  async capNhat(
    maNguoiDung: string,
    nhanThongBao: boolean,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ): Promise<void> {
    if (!(await this.coCotTuyChinh(boThucThi))) {
      throw new Error(`Bang nguoi_dung chua co cot ${TEN_COT}`);
    }

    await boThucThi.truyVan(
      `UPDATE nguoi_dung SET ${TEN_COT} = $2 WHERE ma_nguoi_dung = $1::uuid`,
      [maNguoiDung, nhanThongBao]
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
