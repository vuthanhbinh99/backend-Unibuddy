import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
  BanGhiThongBaoHeThong,
  BoLocNguoiNhanThongBao,
  FcmTokenNguoiNhan,
  NguoiNhanThongBao
} from "../../domain/system-notification.js";

export type DuLieuTaoThongBaoHeThong = {
  actorId: string;
  title: string;
  content: string;
  recipients: NguoiNhanThongBao[];
};

export interface KhoThongBaoHeThong {
  timNguoiNhan(boLoc: BoLocNguoiNhanThongBao, boThucThi?: BoThucThiTruyVan): Promise<NguoiNhanThongBao[]>;
  taoNhieu(
    data: DuLieuTaoThongBaoHeThong,
    boThucThi?: BoThucThiTruyVan
  ): Promise<BanGhiThongBaoHeThong[]>;
  layFcmTokenCuaNguoiNhan(userIds: string[], boThucThi?: BoThucThiTruyVan): Promise<FcmTokenNguoiNhan[]>;
  xoaFcmTokenKhongHopLe(tokens: string[], boThucThi?: BoThucThiTruyVan): Promise<void>;
}
