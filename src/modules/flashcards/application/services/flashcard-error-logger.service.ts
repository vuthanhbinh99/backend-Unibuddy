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

const layTenLoi = (error: unknown) => (error instanceof Error ? error.name : typeof error);

export class DichVuGhiLogLoiFlashcard {
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
          errorName: layTenLoi(input.error)
        }
      });
    } catch (auditError) {
      nhatKy.error("Khong the ghi audit loi module flashcard", {
        error: auditError,
        originalErrorName: layTenLoi(input.error)
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
      nhatKy.error("Khong the ghi audit canh bao module flashcard", {
        error: auditError,
        action: input.action
      });
    }
  }
}
