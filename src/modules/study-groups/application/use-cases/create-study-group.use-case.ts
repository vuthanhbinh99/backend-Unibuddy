import { randomBytes } from "node:crypto";
import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoLichHoc } from "../../../schedules/application/ports/schedule.repository.js";
import type { KhoNhomHocTap, PhamViMonHocNhomHocTap } from "../ports/study-group.repository.js";
import type { DichVuGhiLogLoiNhomHocTap } from "../services/study-group-error-logger.service.js";

export type LenhTaoNhomHocTap = {
  actorId: string;
  tenNhom: string;
  maMonHoc: string;
  linkNhomChat: string;
};

type PhuThuoc = {
  khoNhomHocTap: KhoNhomHocTap;
  khoLichHoc: KhoLichHoc;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiNhomHocTap: DichVuGhiLogLoiNhomHocTap;
};

type NguCanhTaoNhomHocTap = PhamViMonHocNhomHocTap & {
  maMonHoc: string;
  maMon: string;
  maTruong: number;
  tenMon: string;
};

const KY_TU_MA_THAM_GIA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const taoMaThamGia = () =>
  Array.from(randomBytes(8))
    .map((value) => KY_TU_MA_THAM_GIA[value % KY_TU_MA_THAM_GIA.length])
    .join("");

export class XuLyTaoNhomHocTap {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoNhomHocTap) {
    const nguCanhMonHoc = await this.layNguCanhMonHoc(command);
    const tenNhomDaTonTai = await this.deps.khoNhomHocTap.kiemTraTenNhomDaTonTai(
      command.tenNhom,
      nguCanhMonHoc
    );

    if (tenNhomDaTonTai) {
      throw LoiUngDung.xungDot("Tên nhóm học tập đã tồn tại trong môn học và trường này");
    }

    const maThamGia = await this.taoMaThamGiaDocNhat();

    try {
      const nhom = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const nhomMoi = await this.deps.khoNhomHocTap.taoNhom(
          {
            nguoiTao: command.actorId,
            tenNhom: command.tenNhom,
            maMon: nguCanhMonHoc.maMon,
            maTruong: nguCanhMonHoc.maTruong,
            maThamGia,
            linkNhomChat: command.linkNhomChat
          },
          tx
        );

        await this.deps.khoNhomHocTap.themThanhVien(nhomMoi.maNhom, command.actorId, "TRUONG_NHOM", tx);

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "STUDY_GROUP_CREATED",
            tableName: "nhom_hoc_tap",
            recordId: nhomMoi.maNhom,
            message: "Sinh viên đã khởi tạo nhóm học tập mới",
            metadata: {
              maNhom: nhomMoi.maNhom,
              maMonHoc: nguCanhMonHoc.maMonHoc,
              maMon: nguCanhMonHoc.maMon,
              maTruong: nguCanhMonHoc.maTruong,
              tenMon: nguCanhMonHoc.tenMon,
              tenNhom: command.tenNhom,
              vaiTroNguoiTao: "TRUONG_NHOM",
              coLinkNhomChat: Boolean(command.linkNhomChat)
            }
          },
          tx
        );

        return nhomMoi;
      });

      return {
        message: "Tạo nhóm học tập thành công",
        nhom
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiNhomHocTap.ghi({
        actorId: command.actorId,
        action: "STUDY_GROUP_CREATE_FAILED",
        tableName: "nhom_hoc_tap",
        message: "Lỗi lưu thông tin nhóm học tập vào Cơ sở dữ liệu",
        error,
        metadata: {
          maMonHoc: nguCanhMonHoc.maMonHoc,
          maMon: nguCanhMonHoc.maMon,
          maTruong: nguCanhMonHoc.maTruong,
          tenNhom: command.tenNhom
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể tạo nhóm học tập lúc này");
    }
  }

  private async layNguCanhMonHoc(command: LenhTaoNhomHocTap): Promise<NguCanhTaoNhomHocTap> {
    const nguCanh = await this.deps.khoLichHoc.layNguCanhMonHocTrongLichSinhVien(
      command.maMonHoc,
      command.actorId
    );

    if (!nguCanh) {
      throw LoiUngDung.khongCoQuyen("Không thể tạo nhóm cho môn học chưa có trong thời khóa biểu của sinh viên");
    }

    if (!nguCanh.maMon) {
      throw LoiUngDung.yeuCauSai("Môn học trong thời khóa biểu chưa có mã môn, không thể tạo nhóm học tập");
    }

    if (nguCanh.maTruong === null) {
      throw LoiUngDung.yeuCauSai("Tài khoản sinh viên chưa có mã trường, không thể tạo nhóm học tập theo môn học");
    }

    return {
      maMonHoc: nguCanh.maMonHoc,
      maMon: nguCanh.maMon,
      maTruong: nguCanh.maTruong,
      tenMon: nguCanh.tenMon
    };
  }

  private async taoMaThamGiaDocNhat() {
    for (let lanThu = 0; lanThu < 5; lanThu += 1) {
      const maThamGia = taoMaThamGia();
      const daTonTai = await this.deps.khoNhomHocTap.kiemTraMaThamGiaDaTonTai(maThamGia);

      if (!daTonTai) {
        return maThamGia;
      }
    }

    throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể sinh mã mời nhóm lúc này");
  }
}
