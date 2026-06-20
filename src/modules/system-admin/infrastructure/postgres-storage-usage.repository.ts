import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type { KhoDungLuongHeThong } from "../application/ports/storage-usage.repository.js";
import type { DungLuongBangPostgres, DungLuongTheoDanhMuc, ThongKeDungLuongNoiBo } from "../domain/storage-usage.js";

type DongDungLuongBang = {
  tableName: string;
  bytes: string;
};

type DongDungLuongTaiLieu = {
  category: string;
  bytes: string;
  fileCount: string;
};

const chuyenSo = (value: string | number | null | undefined) => Number(value ?? 0);

export class KhoDungLuongHeThongPostgres implements KhoDungLuongHeThong {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async layThongKeNoiBo(): Promise<ThongKeDungLuongNoiBo> {
    const bang = await this.coSoDuLieu.truyVan<DongDungLuongBang>(
      `
        SELECT
          c.relname AS "tableName",
          pg_total_relation_size(c.oid)::text AS "bytes"
        FROM pg_class c
        INNER JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind IN ('r', 'p')
        ORDER BY pg_total_relation_size(c.oid) DESC
      `
    );

    const taiLieu = await this.coSoDuLieu.truyVan<DongDungLuongTaiLieu>(
      `
        SELECT
          COALESCE(NULLIF(loai_file, ''), 'KHAC') AS "category",
          COALESCE(SUM(COALESCE(dung_luong, 0)), 0)::text AS "bytes",
          COUNT(*)::text AS "fileCount"
        FROM tai_lieu
        GROUP BY COALESCE(NULLIF(loai_file, ''), 'KHAC')
        ORDER BY COALESCE(SUM(COALESCE(dung_luong, 0)), 0) DESC
      `
    );

    const tables: DungLuongBangPostgres[] = bang.rows.map((row) => ({
      tableName: row.tableName,
      bytes: chuyenSo(row.bytes)
    }));

    const categories: DungLuongTheoDanhMuc[] = taiLieu.rows.map((row) => ({
      category: row.category,
      bytes: chuyenSo(row.bytes),
      fileCount: chuyenSo(row.fileCount)
    }));

    return {
      database: {
        totalBytes: tables.reduce((total, item) => total + item.bytes, 0),
        tables
      },
      documents: {
        totalBytes: categories.reduce((total, item) => total + item.bytes, 0),
        fileCount: categories.reduce((total, item) => total + item.fileCount, 0),
        categories
      }
    };
  }
}
