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

export type NhatKyHeThong = {
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

export type BoLocNhatKyHeThong = {
  page: number;
  limit: number;
  levels?: MucDoNhatKy[];
  action?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
};

export type KetQuaDanhSachNhatKyHeThong = {
  items: NhatKyHeThong[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};



