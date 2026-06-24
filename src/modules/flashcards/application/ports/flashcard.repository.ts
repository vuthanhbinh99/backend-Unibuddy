import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
  BoFlashcard,
  DuLieuCapNhatBoFlashcard,
  DuLieuCapNhatTheFlashcard,
  DuLieuCapNhatTienDoFlashcard,
  DuLieuTaoBoFlashcard,
  DuLieuTaoTheFlashcard,
  MonHocFlashcard,
  TheFlashcard,
  ThongKeFlashcard
} from "../../domain/flashcard.js";

export type BoLocDanhSachBoFlashcard = {
  actorId: string;
  maMonHoc?: string | null;
};

export interface KhoFlashcard {
  timMonHocCuaSinhVien(
    maMonHoc: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<MonHocFlashcard | null>;
  lietKeBoCuaSinhVien(boLoc: BoLocDanhSachBoFlashcard, boThucThi?: BoThucThiTruyVan): Promise<BoFlashcard[]>;
  timBoCuaSinhVien(maBo: string, maNguoiDung: string, boThucThi?: BoThucThiTruyVan): Promise<BoFlashcard | null>;
  taoBo(data: DuLieuTaoBoFlashcard, boThucThi?: BoThucThiTruyVan): Promise<BoFlashcard>;
  capNhatBo(data: DuLieuCapNhatBoFlashcard, boThucThi?: BoThucThiTruyVan): Promise<BoFlashcard | null>;
  xoaBo(maBo: string, maNguoiDung: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
  taoThe(data: DuLieuTaoTheFlashcard, boThucThi?: BoThucThiTruyVan): Promise<TheFlashcard>;
  taoNhieuThe(data: DuLieuTaoTheFlashcard[], boThucThi?: BoThucThiTruyVan): Promise<TheFlashcard[]>;
  timTheCuaSinhVien(
    maFlashcard: string,
    maNguoiDung: string,
    boThucThi?: BoThucThiTruyVan
  ): Promise<TheFlashcard | null>;
  capNhatThe(data: DuLieuCapNhatTheFlashcard, boThucThi?: BoThucThiTruyVan): Promise<TheFlashcard | null>;
  xoaThe(maFlashcard: string, boThucThi?: BoThucThiTruyVan): Promise<boolean>;
  lietKeTheCanOn(maBo: string, maNguoiDung: string, boThucThi?: BoThucThiTruyVan): Promise<TheFlashcard[]>;
  capNhatTienDo(
    data: DuLieuCapNhatTienDoFlashcard,
    boThucThi?: BoThucThiTruyVan
  ): Promise<TheFlashcard | null>;
  layThongKe(maNguoiDung: string, boThucThi?: BoThucThiTruyVan): Promise<ThongKeFlashcard>;
}
