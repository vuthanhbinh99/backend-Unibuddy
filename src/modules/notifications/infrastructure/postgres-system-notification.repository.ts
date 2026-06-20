import { v7 as uuidv7 } from "uuid";
import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  DuLieuTaoThongBaoHeThong,
  KhoThongBaoHeThong
} from "../application/ports/system-notification.repository.js";
import type {
  BanGhiThongBaoHeThong,
  BoLocNguoiNhanThongBao,
  FcmTokenNguoiNhan,
  MaVaiTroNguoiNhanThongBao,
  NguoiNhanThongBao
} from "../domain/system-notification.js";

type DongNguoiNhanThongBao = {
  userId: string;
  email: string;
  fullName: string;
  roleCode: MaVaiTroNguoiNhanThongBao;
};

type DongFcmToken = {
  userId: string;
  token: string;
};

const anhXaNguoiNhan = (row: DongNguoiNhanThongBao): NguoiNhanThongBao => ({
  userId: row.userId,
  email: row.email,
  fullName: row.fullName,
  roleCode: row.roleCode
});

export class KhoThongBaoHeThongPostgres implements KhoThongBaoHeThong {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async timNguoiNhan(boLoc: BoLocNguoiNhanThongBao, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const params: unknown[] = [];
    const dieuKienDoiTuong: string[] = [];

    if (boLoc.roleCodes?.length) {
      params.push(boLoc.roleCodes);
      dieuKienDoiTuong.push(`vt.ma_code = ANY($${params.length}::text[])`);
    }

    if (boLoc.userIds?.length) {
      params.push(boLoc.userIds);
      dieuKienDoiTuong.push(`nd.ma_nguoi_dung = ANY($${params.length}::uuid[])`);
    }

    if (!boLoc.allUsers && dieuKienDoiTuong.length === 0) {
      return [];
    }

    const dieuKienLocDoiTuong = boLoc.allUsers ? "" : `AND (${dieuKienDoiTuong.join(" OR ")})`;

    const ketQua = await boThucThi.truyVan<DongNguoiNhanThongBao>(
      `
        SELECT DISTINCT
          nd.ma_nguoi_dung AS "userId",
          nd.email AS "email",
          nd.ho_ten AS "fullName",
          vt.ma_code AS "roleCode"
        FROM nguoi_dung nd
        INNER JOIN vai_tro vt ON vt.ma_vai_tro = nd.ma_vai_tro
        WHERE nd.trang_thai = 'HOAT_DONG'
          ${dieuKienLocDoiTuong}
        ORDER BY nd.email ASC
      `,
      params
    );

    return ketQua.rows.map(anhXaNguoiNhan);
  }

  async taoNhieu(
    data: DuLieuTaoThongBaoHeThong,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ): Promise<BanGhiThongBaoHeThong[]> {
    if (data.recipients.length === 0) {
      return [];
    }

    const notificationIds = data.recipients.map(() => uuidv7());
    const recipientIds = data.recipients.map((nguoiNhan) => nguoiNhan.userId);

    const ketQua = await boThucThi.truyVan<{
      id: string;
      recipientId: string;
    }>(
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
          ids.ma_thong_bao,
          ids.ma_nguoi_nhan,
          $3::uuid,
          $4,
          $5,
          'HE_THONG',
          NOW(),
          NOW()
        FROM unnest($1::uuid[], $2::uuid[]) AS ids(ma_thong_bao, ma_nguoi_nhan)
        RETURNING ma_thong_bao AS "id", ma_nguoi_nhan AS "recipientId"
      `,
      [notificationIds, recipientIds, data.actorId, data.title, data.content]
    );

    return ketQua.rows;
  }

  async layFcmTokenCuaNguoiNhan(userIds: string[], boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    if (userIds.length === 0) {
      return [];
    }

    const ketQua = await boThucThi.truyVan<DongFcmToken>(
      `
        SELECT DISTINCT ON (pdn.fcm_token)
          pdn.ma_nguoi_dung AS "userId",
          pdn.fcm_token AS "token"
        FROM phien_dang_nhap pdn
        WHERE pdn.ma_nguoi_dung = ANY($1::uuid[])
          AND pdn.fcm_token IS NOT NULL
          AND pdn.thoi_gian_thu_hoi IS NULL
          AND pdn.thoi_gian_het_han > NOW()
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

    await boThucThi.truyVan(
      `
        UPDATE phien_dang_nhap
        SET fcm_token = NULL
        WHERE fcm_token = ANY($1::text[])
      `,
      [uniqueTokens]
    );
  }
}
