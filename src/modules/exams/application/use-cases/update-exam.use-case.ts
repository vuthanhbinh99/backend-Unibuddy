import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DuLieuLichThi } from "../../domain/exam.js";
import type { KhoLichThi } from "../ports/exam.repository.js";

export type LenhCapNhatLichThi = DuLieuLichThi & {
  actorId: string;
  maLichThi: string;
};

type PhuThuoc = {
  khoLichThi: KhoLichThi;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyCapNhatLichThi {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatLichThi) {
    const lichThiHienTai = await this.deps.khoLichThi.timTheoMaCuaSinhVien(command.maLichThi, command.actorId);

    if (!lichThiHienTai) {
      throw LoiUngDung.khongTimThay("Không tìm thấy lịch thi");
    }

    if (Number.isNaN(command.thoiGianThi.getTime())) {
      throw LoiUngDung.yeuCauSai("Thời gian thi không hợp lệ");
    }

    const monHoc = await this.deps.khoLichThi.timMonHocCuaSinhVien(command.maMonHoc, command.actorId);

    if (!monHoc) {
      throw LoiUngDung.khongTimThay("Môn học này chưa có trong hệ thống");
    }

    try {
      const lichThi = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const lichThiMoi = await this.deps.khoLichThi.capNhat(
          command.maLichThi,
          {
            maMonHoc: command.maMonHoc,
            thoiGianThi: command.thoiGianThi,
            phongThi: command.phongThi,
            diaDiemThi: command.diaDiemThi
          },
          tx
        );

        if (!lichThiMoi) {
          throw LoiUngDung.khongTimThay("Không tìm thấy lịch thi");
        }

        await this.deps.khoLichThi.xoaNhacNhoTheoLichThi(command.maLichThi, tx);
        await this.deps.khoLichThi.taoNhacNhoTruocMotNgay(command.actorId, command.maLichThi, lichThiMoi.thoiGianThi, tx);
        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "EXAM_UPDATED",
            tableName: "lich_thi",
            recordId: command.maLichThi,
            message: "Sinh viên cập nhật lịch thi",
            metadata: {
              maLichThi: command.maLichThi,
              maMonHocCu: lichThiHienTai.maMonHoc,
              maMonHocMoi: lichThiMoi.maMonHoc,
              thoiGianThiMoi: lichThiMoi.thoiGianThi
            }
          },
          tx
        );
        return lichThiMoi;
      });

      return {
        message: "Cập nhật lịch thi thành công",
        lichThi
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể cập nhật lịch thi lúc này");
    }
  }
}
