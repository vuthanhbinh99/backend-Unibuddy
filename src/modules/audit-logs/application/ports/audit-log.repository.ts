import type { QueryExecutor } from "../../../../shared/database/database.js";
import type { AuditLogEntry } from "../../domain/audit-log-entry.js";

export interface AuditLogRepository {
  create(entry: AuditLogEntry, executor?: QueryExecutor): Promise<void>;
}
