import { v7 as uuidv7 } from "uuid";
import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  BanGhiThongBaoNhacDeadline,
  DuLieuThongBaoNhacDeadline,
  KhoThongBaoNhacDeadline
} from "../application/ports/deadline-notification.repository.js";
import type { FcmTokenNguoiNhan } from "../domain/system-notification.js";

type DongFcmToken = {
  userId: string;
  token: string;
};

const COT_NHAN_THONG_BAO = "nhan_thong_bao_day";

export class KhoThongBaoNhacDeadlinePostgres implements KhoThongBaoNhacDeadline {
  private coCotNhanThongBao?: boolean;

  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async taoNhieu(
    danhSach: DuLieuThongBaoNhacDeadline[],
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ): Promise<BanGhiThongBaoNhacDeadline[]> {
    if (danhSach.length === 0) {
      return [];
    }

    const notificationIds = danhSach.map(() => uuidv7());
    const recipientIds = danhSach.map((item) => item.maNguoiNhan);
    const tieuDes = danhSach.map((item) => item.tieuDe);
    const noiDungs = danhSach.map((item) => item.noiDung);
    const loaiThongBaos = danhSach.map((item) => item.loaiThongBao ?? "DEADLINE");

    const ketQua = await boThucThi.truyVan<BanGhiThongBaoNhacDeadline>(
      `
        INSERT INTO thong_bao (
          ma_thong_bao,
          ma_nguoi_nhan,
          nguoi_tao,
          tieu_de,
          noi_dung,
          loai_thong_bao,
          thoi_gian_da_gui,
          thoi_gian_tao
        )
        SELECT
          rows.ma_thong_bao,
          rows.ma_nguoi_nhan,
          NULL,
          rows.tieu_de,
          rows.noi_dung,
          rows.loai_thong_bao::enum_loai_thong_bao,
          NOW(),
          NOW()
        FROM unnest($1::uuid[], $2::uuid[], $3::text[], $4::text[], $5::text[])
          AS rows(ma_thong_bao, ma_nguoi_nhan, tieu_de, noi_dung, loai_thong_bao)
        RETURNING ma_thong_bao AS "maThongBao", ma_nguoi_nhan AS "maNguoiNhan"
      `,
      [notificationIds, recipientIds, tieuDes, noiDungs, loaiThongBaos]
    );

    return ketQua.rows;
  }

  async layFcmTokenCuaNguoiNhan(
    userIds: string[],
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ): Promise<FcmTokenNguoiNhan[]> {
    if (userIds.length === 0) {
      return [];
    }

    // Bỏ qua người dùng đã tắt "Thông báo ứng dụng" (nhan_thong_bao_day = FALSE).
    // Nếu cột chưa tồn tại (migration chưa chạy) thì coi như mọi người đều bật.
    const locTheoTuyChon = (await this.coCotTuyChinhThongBao(boThucThi))
      ? `AND COALESCE(nd.${COT_NHAN_THONG_BAO}, TRUE) = TRUE`
      : "";

    const ketQua = await boThucThi.truyVan<DongFcmToken>(
      `
        SELECT DISTINCT ON (pdn.fcm_token)
          pdn.ma_nguoi_dung AS "userId",
          pdn.fcm_token AS "token"
        FROM phien_dang_nhap pdn
        INNER JOIN nguoi_dung nd ON nd.ma_nguoi_dung = pdn.ma_nguoi_dung
        WHERE pdn.ma_nguoi_dung = ANY($1::uuid[])
          AND pdn.fcm_token IS NOT NULL
          AND pdn.thoi_gian_thu_hoi IS NULL
          AND pdn.thoi_gian_het_han > NOW()
          ${locTheoTuyChon}
        ORDER BY pdn.fcm_token, pdn.lan_hoat_dong_cuoi DESC
      `,
      [userIds]
    );

    return ketQua.rows.map((row) => ({
      userId: row.userId,
      token: row.token
    }));
  }

  async xoaFcmTokenKhongHopLe(tokens: string[], boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const uniqueTokens = [...new Set(tokens.filter(Boolean))];

    if (uniqueTokens.length === 0) {
      return;
    }

    await boThucThi.truyVan("UPDATE phien_dang_nhap SET fcm_token = NULL WHERE fcm_token = ANY($1::text[])", [
      uniqueTokens
    ]);
  }

  private async coCotTuyChinhThongBao(boThucThi: BoThucThiTruyVan) {
    if (this.coCotNhanThongBao !== undefined) {
      return this.coCotNhanThongBao;
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
      [COT_NHAN_THONG_BAO]
    );

    this.coCotNhanThongBao = ketQua.rows[0]?.exists ?? false;
    return this.coCotNhanThongBao;
  }
}
