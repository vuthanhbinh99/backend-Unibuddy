export type AuditLogLevel = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type AuditLogEntry = {
  actorId: string | null;
  level: AuditLogLevel;
  action: string;
  tableName?: string | null;
  recordId?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
};
