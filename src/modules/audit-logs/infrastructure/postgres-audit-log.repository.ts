import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type { KhoNhatKyHeThong } from "../application/ports/audit-log.repository.js";
import type {
  BanGhiNhatKyHeThong,
  BoLocNhatKyHeThong,
  KetQuaDanhSachNhatKyHeThong,
  MucDoNhatKy,
  NhatKyHeThong
} from "../domain/audit-log-entry.js";

type DongNhatKyHeThong = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorFullName: string | null;
  level: MucDoNhatKy;
  action: string;
  tableName: string | null;
  recordId: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

type DongDem = {
  total: string;
};

const anhXaNhatKy = (row: DongNhatKyHeThong): NhatKyHeThong => ({
  id: row.id,
  actorId: row.actorId,
  actorEmail: row.actorEmail,
  actorFullName: row.actorFullName,
  level: row.level,
  action: row.action,
  tableName: row.tableName,
  recordId: row.recordId,
  message: row.message,
  metadata: row.metadata,
  createdAt: row.createdAt
});

const cauTruyVanNhatKy = `
  SELECT
    nkt.ma_nhat_ky::text AS "id",
    nkt.nguoi_thuc_hien AS "actorId",
    nd.email AS "actorEmail",
    nd.ho_ten AS "actorFullName",
    nkt.muc_do AS "level",
    nkt.hanh_dong AS "action",
    nkt.bang_tac_dong AS "tableName",
    nkt.ma_ban_ghi AS "recordId",
    nkt.noi_dung AS "message",
    nkt.du_lieu_json AS "metadata",
    nkt.thoi_gian AS "createdAt"
  FROM nhat_ky_he_thong nkt
  LEFT JOIN nguoi_dung nd ON nd.ma_nguoi_dung = nkt.nguoi_thuc_hien
`;

const xayDungDieuKienLoc = (boLoc: BoLocNhatKyHeThong, params: unknown[]) => {
  const dieuKien: string[] = [];

  if (boLoc.levels?.length) {
    params.push(boLoc.levels);
    dieuKien.push(`nkt.muc_do = ANY($${params.length}::enum_muc_do_log[])`);
  }

  if (boLoc.action) {
    params.push(`%${boLoc.action}%`);
    dieuKien.push(`nkt.hanh_dong ILIKE $${params.length}`);
  }

  if (boLoc.actorId) {
    params.push(boLoc.actorId);
    dieuKien.push(`nkt.nguoi_thuc_hien = $${params.length}::uuid`);
  }

  if (boLoc.from) {
    params.push(boLoc.from);
    dieuKien.push(`nkt.thoi_gian >= $${params.length}`);
  }

  if (boLoc.to) {
    params.push(boLoc.to);
    dieuKien.push(`nkt.thoi_gian <= $${params.length}`);
  }

  return dieuKien.length ? `WHERE ${dieuKien.join(" AND ")}` : "";
};

export class KhoNhatKyHeThongPostgres implements KhoNhatKyHeThong {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async tao(entry: BanGhiNhatKyHeThong, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    await boThucThi.truyVan(
      `
        INSERT INTO nhat_ky_he_thong (
          nguoi_thuc_hien,
          muc_do,
          hanh_dong,
          bang_tac_dong,
          ma_ban_ghi,
          noi_dung,
          du_lieu_json,
          thoi_gian
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
      `,
      [
        entry.actorId,
        entry.level,
        entry.action,
        entry.tableName ?? null,
        entry.recordId ?? null,
        entry.message ?? null,
        entry.metadata ? JSON.stringify(entry.metadata) : null
      ]
    );
  }

  async lietKe(
    boLoc: BoLocNhatKyHeThong,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ): Promise<KetQuaDanhSachNhatKyHeThong> {
    const paramsLoc: unknown[] = [];
    const dieuKien = xayDungDieuKienLoc(boLoc, paramsLoc);
    const offset = (boLoc.page - 1) * boLoc.limit;

    const dem = await boThucThi.truyVan<DongDem>(
      `
        SELECT COUNT(*)::text AS "total"
        FROM nhat_ky_he_thong nkt
        ${dieuKien}
      `,
      paramsLoc
    );

    const total = Number(dem.rows[0]?.total ?? 0);
    const paramsDanhSach = [...paramsLoc, boLoc.limit, offset];
    const limitIndex = paramsLoc.length + 1;
    const offsetIndex = paramsLoc.length + 2;

    const ketQua = await boThucThi.truyVan<DongNhatKyHeThong>(
      `
        ${cauTruyVanNhatKy}
        ${dieuKien}
        ORDER BY nkt.thoi_gian DESC, nkt.ma_nhat_ky DESC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
      `,
      paramsDanhSach
    );

    return {
      items: ketQua.rows.map(anhXaNhatKy),
      page: boLoc.page,
      limit: boLoc.limit,
      total,
      totalPages: Math.ceil(total / boLoc.limit)
    };
  }

  async timTheoMa(logId: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongNhatKyHeThong>(
      `
        ${cauTruyVanNhatKy}
        WHERE nkt.ma_nhat_ky = $1::bigint
        LIMIT 1
      `,
      [logId]
    );

    return ketQua.rows[0] ? anhXaNhatKy(ketQua.rows[0]) : null;
  }
}



