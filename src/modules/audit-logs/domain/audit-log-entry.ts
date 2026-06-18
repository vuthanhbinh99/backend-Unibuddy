export type MucDoNhatKy = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type BanGhiNhatKyHeThong = {
  actorId: string | null;
  level: MucDoNhatKy;
  action: string;
  tableName?: string | null;
  recordId?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
};



