import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type { BanGhiNhatKyHeThong } from "../../domain/audit-log-entry.js";

export interface KhoNhatKyHeThong {
  tao(entry: BanGhiNhatKyHeThong, boThucThi?: BoThucThiTruyVan): Promise<void>;
}



