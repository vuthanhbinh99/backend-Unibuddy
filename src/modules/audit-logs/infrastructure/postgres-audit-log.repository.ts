import type { QueryExecutor } from "../../../shared/database/database.js";
import type { AuditLogRepository } from "../application/ports/audit-log.repository.js";
import type { AuditLogEntry } from "../domain/audit-log-entry.js";

export class PostgresAuditLogRepository implements AuditLogRepository {
  constructor(private readonly db: QueryExecutor) {}

  async create(entry: AuditLogEntry, executor: QueryExecutor = this.db) {
    await executor.query(
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
}
