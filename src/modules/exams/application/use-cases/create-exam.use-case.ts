import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DuLieuLichThi } from "../../domain/exam.js";
import type { KhoLichThi } from "../ports/exam.repository.js";

export type LenhTaoLichThi = DuLieuLichThi & {
  actorId: string;
  replaceExistingExam?: boolean;
};

type PhuThuoc = {
  khoLichThi: KhoLichThi;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
};

const kiemTraDuLieu = (data: DuLieuLichThi) => {
  const loi: string[] = [];

  if (Number.isNaN(data.thoiGianThi.getTime())) {
    loi.push("Thời gian thi không hợp lệ");
  }

  return loi;
};

export class XuLyTaoLichThi {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoLichThi) {
    const data = this.layDuLieu(command);
    const loiDuLieu = kiemTraDuLieu(data);

    if (loiDuLieu.length > 0) {
      throw LoiUngDung.yeuCauSai("Dữ liệu lịch thi không hợp lệ", loiDuLieu);
    }

    const monHoc = await this.deps.khoLichThi.timMonHocCuaSinhVien(command.maMonHoc, command.actorId);

    if (!monHoc) {
      throw LoiUngDung.khongTimThay("Môn học này chưa có trong hệ thống");
    }

    const lichThiHienCo = await this.deps.khoLichThi.lietKeTheoSinhVien(command.actorId, {
      maMonHoc: command.maMonHoc
    });

    if (lichThiHienCo.length > 0 && command.replaceExistingExam !== true) {
      throw LoiUngDung.xungDot("Môn học này đã có lịch thi", {
        reasonCode: "EXAM_ALREADY_EXISTS",
        maMonHoc: command.maMonHoc,
        soLichThiHienCo: lichThiHienCo.length
      });
    }

    try {
      const lichThi = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const soLichThiGhiDe =
          command.replaceExistingExam === true
            ? await this.deps.khoLichThi.xoaTheoMonHoc([command.maMonHoc], tx)
            : 0;
        const lichThiMoi = await this.deps.khoLichThi.tao(data, tx);
        await this.deps.khoLichThi.taoNhacNhoTruocMotNgay(command.actorId, lichThiMoi.maLichThi, lichThiMoi.thoiGianThi, tx);
        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "EXAM_CREATED",
            tableName: "lich_thi",
            recordId: lichThiMoi.maLichThi,
            message: "Sinh viên thêm lịch thi",
            metadata: {
              maLichThi: lichThiMoi.maLichThi,
              maMonHoc: lichThiMoi.maMonHoc,
              thoiGianThi: lichThiMoi.thoiGianThi,
              soLichThiGhiDe
            }
          },
          tx
        );
        return lichThiMoi;
      });

      return {
        message: "Thêm lịch thi thành công",
        lichThi
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.khoNhatKyHeThong
        .tao({
          actorId: command.actorId,
          level: "ERROR",
          action: "EXAM_CREATE_FAILED",
          tableName: "lich_thi",
          message: "Lỗi lưu lịch thi",
          metadata: {
            maMonHoc: command.maMonHoc,
            errorName: error instanceof Error ? error.name : "UnknownError"
          }
        })
        .catch(() => undefined);
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể thêm lịch thi lúc này");
    }
  }

  private layDuLieu(command: LenhTaoLichThi): DuLieuLichThi {
    return {
      maMonHoc: command.maMonHoc,
      thoiGianThi: command.thoiGianThi,
      phongThi: command.phongThi,
      diaDiemThi: command.diaDiemThi
    };
  }
}
