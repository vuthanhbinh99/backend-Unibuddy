import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
  BanGhiNhatKyHeThong,
  BoLocNhatKyHeThong,
  KetQuaDanhSachNhatKyHeThong,
  NhatKyHeThong
} from "../../domain/audit-log-entry.js";

export interface KhoNhatKyHeThong {
  tao(entry: BanGhiNhatKyHeThong, boThucThi?: BoThucThiTruyVan): Promise<void>;
  lietKe(boLoc: BoLocNhatKyHeThong, boThucThi?: BoThucThiTruyVan): Promise<KetQuaDanhSachNhatKyHeThong>;
  timTheoMa(logId: string, boThucThi?: BoThucThiTruyVan): Promise<NhatKyHeThong | null>;
}



