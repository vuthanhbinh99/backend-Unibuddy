import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
  BoLocThongBaoNguoiDung,
  KetQuaDanhSachThongBaoNguoiDung
} from "../../domain/user-notification.js";

export interface KhoThongBaoNguoiDung {
  lietKe(
    boLoc: BoLocThongBaoNguoiDung,
    boThucThi?: BoThucThiTruyVan
  ): Promise<KetQuaDanhSachThongBaoNguoiDung>;
  danhDauDaDoc(
    userId: string,
    maThongBao: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<boolean>;
  danhDauTatCaDaDoc(userId: string, boThucThi?: BoThucThiTruyVan): Promise<number>;
}
