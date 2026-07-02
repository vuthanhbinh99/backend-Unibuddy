import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type { KhoThongBaoNguoiDung } from "../application/ports/user-notification.repository.js";
import type {
  BoLocThongBaoNguoiDung,
  KetQuaDanhSachThongBaoNguoiDung,
  ThongBaoNguoiDung
} from "../domain/user-notification.js";

type KieuCotDaDoc =
  | { kind: "timestamp"; name: "thoi_gian_da_doc" | "thoi_gian_doc" }
  | { kind: "boolean"; name: "da_doc" }
  | null;

type DongThongBaoNguoiDung = {
  maThongBao: string;
  maNguoiNhan: string;
  nguoiTao: string | null;
  tieuDe: string;
  noiDung: string;
  loaiThongBao: string;
  maCongViec: string | null;
  thoiGianDaGui: Date | null;
  createdAt: Date;
  readAt: Date | null;
  isRead: boolean;
};

type DongDem = {
  total: string;
};

const anhXaThongBao = (row: DongThongBaoNguoiDung): ThongBaoNguoiDung => ({
  maThongBao: row.maThongBao,
  maNguoiNhan: row.maNguoiNhan,
  nguoiTao: row.nguoiTao,
  tieuDe: row.tieuDe,
  noiDung: row.noiDung,
  loaiThongBao: row.loaiThongBao,
  maCongViec: row.maCongViec,
  thoiGianDaGui: row.thoiGianDaGui,
  createdAt: row.createdAt,
  readAt: row.readAt,
  isRead: row.isRead
});

export class KhoThongBaoNguoiDungPostgres implements KhoThongBaoNguoiDung {
  private cotDaDoc?: KieuCotDaDoc;
  private hoTroMaCongViec?: boolean;

  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async lietKe(
    boLoc: BoLocThongBaoNguoiDung,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ): Promise<KetQuaDanhSachThongBaoNguoiDung> {
    const cotDaDoc = await this.layCotDaDoc(boThucThi);
    const coMaCongViec = await this.coHoTroMaCongViec(boThucThi);
    const params: unknown[] = [boLoc.userId];
    const dieuKien = this.xayDungDieuKienLoc(boLoc, params, cotDaDoc);
    const dieuKienSql = `WHERE ${dieuKien.join(" AND ")}`;
    const offset = (boLoc.page - 1) * boLoc.limit;

    const dem = await boThucThi.truyVan<DongDem>(
      `
        SELECT COUNT(*)::text AS "total"
        FROM thong_bao tb
        ${dieuKienSql}
      `,
      params
    );

    const dieuKienChuaDoc = this.dieuKienChuaDoc(cotDaDoc);
    const demChuaDoc = await boThucThi.truyVan<DongDem>(
      `
        SELECT COUNT(*)::text AS "total"
        FROM thong_bao tb
        WHERE tb.ma_nguoi_nhan = $1::uuid
          ${dieuKienChuaDoc ? `AND ${dieuKienChuaDoc}` : ""}
      `,
      [boLoc.userId]
    );

    const total = Number(dem.rows[0]?.total ?? 0);
    const paramsDanhSach = [...params, boLoc.limit, offset];
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;
    const ketQua = await boThucThi.truyVan<DongThongBaoNguoiDung>(
      `
        SELECT
          tb.ma_thong_bao AS "maThongBao",
          tb.ma_nguoi_nhan AS "maNguoiNhan",
          tb.nguoi_tao AS "nguoiTao",
          tb.tieu_de AS "tieuDe",
          tb.noi_dung AS "noiDung",
          tb.loai_thong_bao::text AS "loaiThongBao",
          ${coMaCongViec ? "tb.ma_cong_viec" : "NULL::uuid"} AS "maCongViec",
          tb.thoi_gian_da_gui AS "thoiGianDaGui",
          tb.thoi_gian_tao AS "createdAt",
          ${this.cotDocSelect(cotDaDoc)}
        FROM thong_bao tb
        ${dieuKienSql}
        ORDER BY COALESCE(tb.thoi_gian_da_gui, tb.thoi_gian_tao) DESC, tb.ma_thong_bao DESC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
      `,
      paramsDanhSach
    );

    return {
      message: total === 0 ? "Không tìm thấy thông báo phù hợp" : "Tải danh sách thông báo thành công",
      items: ketQua.rows.map(anhXaThongBao),
      total,
      unreadCount: Number(demChuaDoc.rows[0]?.total ?? 0),
      page: boLoc.page,
      limit: boLoc.limit,
      totalPages: Math.ceil(total / boLoc.limit),
      readTrackingSupported: cotDaDoc !== null
    };
  }

  async danhDauDaDoc(
    userId: string,
    maThongBao: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const cotDaDoc = await this.layCotDaDoc(boThucThi);
    const cauLenhCapNhat = this.cauLenhCapNhatDaDoc(cotDaDoc);

    if (!cauLenhCapNhat) {
      return false;
    }

    const dieuKienChuaDoc = this.dieuKienChuaDoc(cotDaDoc);
    const ketQua = await boThucThi.truyVan(
      `
        UPDATE thong_bao tb
        SET ${cauLenhCapNhat}
        WHERE tb.ma_thong_bao = $1::uuid
          AND tb.ma_nguoi_nhan = $2::uuid
          ${dieuKienChuaDoc ? `AND ${dieuKienChuaDoc}` : ""}
      `,
      [maThongBao, userId]
    );

    return (ketQua.rowCount ?? 0) > 0;
  }

  async danhDauTatCaDaDoc(userId: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const cotDaDoc = await this.layCotDaDoc(boThucThi);
    const cauLenhCapNhat = this.cauLenhCapNhatDaDoc(cotDaDoc);

    if (!cauLenhCapNhat) {
      return 0;
    }

    const dieuKienChuaDoc = this.dieuKienChuaDoc(cotDaDoc);
    const ketQua = await boThucThi.truyVan(
      `
        UPDATE thong_bao tb
        SET ${cauLenhCapNhat}
        WHERE tb.ma_nguoi_nhan = $1::uuid
          ${dieuKienChuaDoc ? `AND ${dieuKienChuaDoc}` : ""}
      `,
      [userId]
    );

    return ketQua.rowCount ?? 0;
  }

  private xayDungDieuKienLoc(
    boLoc: BoLocThongBaoNguoiDung,
    params: unknown[],
    cotDaDoc: KieuCotDaDoc
  ) {
    const dieuKien = ["tb.ma_nguoi_nhan = $1::uuid"];

    if (boLoc.onlyUnread) {
      const dieuKienChuaDoc = this.dieuKienChuaDoc(cotDaDoc);
      if (dieuKienChuaDoc) {
        dieuKien.push(dieuKienChuaDoc);
      }
    }

    if (boLoc.loaiThongBao) {
      params.push(boLoc.loaiThongBao);
      dieuKien.push(`tb.loai_thong_bao::text = $${params.length}`);
    }

    return dieuKien;
  }

  private cotDocSelect(cotDaDoc: KieuCotDaDoc) {
    if (!cotDaDoc) {
      return "NULL::timestamptz AS \"readAt\", false AS \"isRead\"";
    }

    if (cotDaDoc.kind === "timestamp") {
      return `tb.${cotDaDoc.name} AS "readAt", tb.${cotDaDoc.name} IS NOT NULL AS "isRead"`;
    }

    return `NULL::timestamptz AS "readAt", COALESCE(tb.${cotDaDoc.name}, false) AS "isRead"`;
  }

  private dieuKienChuaDoc(cotDaDoc: KieuCotDaDoc) {
    if (!cotDaDoc) {
      return "";
    }

    if (cotDaDoc.kind === "timestamp") {
      return `tb.${cotDaDoc.name} IS NULL`;
    }

    return `COALESCE(tb.${cotDaDoc.name}, false) = false`;
  }

  private cauLenhCapNhatDaDoc(cotDaDoc: KieuCotDaDoc) {
    if (!cotDaDoc) {
      return "";
    }

    if (cotDaDoc.kind === "timestamp") {
      return `${cotDaDoc.name} = COALESCE(${cotDaDoc.name}, NOW())`;
    }

    return `${cotDaDoc.name} = true`;
  }

  private async layCotDaDoc(boThucThi: BoThucThiTruyVan) {
    if (this.cotDaDoc !== undefined) {
      return this.cotDaDoc;
    }

    if (await this.coCotTrongBang("thong_bao", "thoi_gian_da_doc", boThucThi)) {
      this.cotDaDoc = { kind: "timestamp", name: "thoi_gian_da_doc" };
      return this.cotDaDoc;
    }

    if (await this.coCotTrongBang("thong_bao", "thoi_gian_doc", boThucThi)) {
      this.cotDaDoc = { kind: "timestamp", name: "thoi_gian_doc" };
      return this.cotDaDoc;
    }

    if (await this.coCotTrongBang("thong_bao", "da_doc", boThucThi)) {
      this.cotDaDoc = { kind: "boolean", name: "da_doc" };
      return this.cotDaDoc;
    }

    this.cotDaDoc = null;
    return this.cotDaDoc;
  }

  private async coHoTroMaCongViec(boThucThi: BoThucThiTruyVan) {
    if (this.hoTroMaCongViec !== undefined) {
      return this.hoTroMaCongViec;
    }

    this.hoTroMaCongViec = await this.coCotTrongBang("thong_bao", "ma_cong_viec", boThucThi);
    return this.hoTroMaCongViec;
  }

  private async coCotTrongBang(tenBang: string, tenCot: string, boThucThi: BoThucThiTruyVan) {
    const ketQua = await boThucThi.truyVan<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = $1
            AND column_name = $2
        ) AS "exists"
      `,
      [tenBang, tenCot]
    );

    return ketQua.rows[0]?.exists ?? false;
  }
}
