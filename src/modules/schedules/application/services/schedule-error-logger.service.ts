import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import { nhatKy } from "../../../../shared/logger/logger.js";

type PhuThuoc = {
  khoNhatKyHeThong: KhoNhatKyHeThong;
};

type DuLieuGhiLogLoi = {
  actorId: string;
  action: string;
  tableName?: string;
  recordId?: string;
  message: string;
  error: unknown;
  metadata?: Record<string, unknown>;
};

type DuLieuGhiCanhBao = Omit<DuLieuGhiLogLoi, "error">;

type LoiCoThongTin = {
  name?: unknown;
  message?: unknown;
  code?: unknown;
  detail?: unknown;
  constraint?: unknown;
  routine?: unknown;
};

const layThongTinLoi = (error: unknown) => {
  if (error instanceof Error) {
    const loi = error as LoiCoThongTin;
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorCode: typeof loi.code === "string" ? loi.code : null,
      errorDetail: typeof loi.detail === "string" ? loi.detail : null,
      errorConstraint: typeof loi.constraint === "string" ? loi.constraint : null,
      errorRoutine: typeof loi.routine === "string" ? loi.routine : null
    };
  }

  if (typeof error === "object" && error !== null) {
    const loi = error as LoiCoThongTin;
    return {
      errorName: typeof loi.name === "string" ? loi.name : typeof error,
      errorMessage: typeof loi.message === "string" ? loi.message : null,
      errorCode: typeof loi.code === "string" ? loi.code : null,
      errorDetail: typeof loi.detail === "string" ? loi.detail : null,
      errorConstraint: typeof loi.constraint === "string" ? loi.constraint : null,
      errorRoutine: typeof loi.routine === "string" ? loi.routine : null
    };
  }

  return {
    errorName: typeof error,
    errorMessage: null,
    errorCode: null,
    errorDetail: null,
    errorConstraint: null,
    errorRoutine: null
  };
};

export class DichVuGhiLogLoiThoiKhoaBieu {
  constructor(private readonly deps: PhuThuoc) {}

  async ghi(input: DuLieuGhiLogLoi) {
    try {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: input.actorId,
        level: "ERROR",
        action: input.action,
        tableName: input.tableName,
        recordId: input.recordId,
        message: input.message,
        metadata: {
          ...(input.metadata ?? {}),
          ...layThongTinLoi(input.error)
        }
      });
    } catch (auditError) {
      nhatKy.error("Không thể ghi log lỗi module thời khóa biểu", {
        error: auditError,
        originalError: layThongTinLoi(input.error)
      });
    }
  }

  async ghiCanhBao(input: DuLieuGhiCanhBao) {
    try {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: input.actorId,
        level: "WARNING",
        action: input.action,
        tableName: input.tableName,
        recordId: input.recordId,
        message: input.message,
        metadata: input.metadata
      });
    } catch (auditError) {
      nhatKy.error("Không thể ghi audit cảnh báo module thời khóa biểu", {
        error: auditError,
        action: input.action
      });
    }
  }
}
