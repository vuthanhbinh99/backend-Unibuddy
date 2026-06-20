import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoNguoiDung } from "../ports/user.repository.js";
import { anhXaNguoiDungQuanTri, type NguoiDungQuanTri } from "../../domain/user.js";

export type LenhCapNhatVaiTroNguoiDung = {
  actorId: string | null;
  userId: string;
  roleCode: "SINH_VIEN" | "ADMIN" | "QUAN_TRI_VIEN";
};

export type KetQuaCapNhatVaiTroNguoiDung = {
  user: NguoiDungQuanTri;
};

type PhuThuoc = {
  khoNguoiDung: KhoNguoiDung;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyCapNhatVaiTroNguoiDung {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatVaiTroNguoiDung): Promise<KetQuaCapNhatVaiTroNguoiDung> {
    const user = await this.deps.khoNguoiDung.timTheoMa(command.userId);

    if (!user) {
      throw LoiUngDung.khongTimThay("Không tìm thấy người dùng");
    }

    const userUpdated = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      const capNhat = await this.deps.khoNguoiDung.capNhatVaiTro(
        {
          userId: command.userId,
          roleCode: command.roleCode
        },
        tx
      );

      if (!capNhat) {
        throw LoiUngDung.khongTimThay("Không tìm thấy người dùng");
      }

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId,
          level: "INFO",
          action: "USER_ROLE_UPDATED",
          tableName: "nguoi_dung",
          recordId: command.userId,
          message: "Quản trị viên đã thay đổi vai trò người dùng",
          metadata: {
            userId: command.userId,
            roleCode: command.roleCode,
            oldRoleCode: user.role.code
          }
        },
        tx
      );

      return capNhat;
    });

    return {
      user: anhXaNguoiDungQuanTri(userUpdated)
    };
  }
}