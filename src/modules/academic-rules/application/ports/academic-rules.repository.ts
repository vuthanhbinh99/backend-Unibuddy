import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
  CauHinhHocThuatTruongHoc,
  MucThangDiem,
  MucThangDiemNhap,
  QuyCheHocLuc,
  QuyCheHocLucNhap
} from "../../domain/academic-rules.js";

export interface KhoHocThuatTruongHoc {
  layCauHinh(maTruongCode: string, boThucThi?: BoThucThiTruyVan): Promise<CauHinhHocThuatTruongHoc>;
  capNhatThangDiem(
    maTruongCode: string,
    mucThangDiem: MucThangDiemNhap[],
    boThucThi?: BoThucThiTruyVan
  ): Promise<void>;
  capNhatQuyCheHocLuc(
    maTruongCode: string,
    quyCheHocLuc: QuyCheHocLucNhap[],
    boThucThi?: BoThucThiTruyVan
  ): Promise<void>;
}
