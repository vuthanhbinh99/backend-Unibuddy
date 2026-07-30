import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DuLieuImportLichThi, DuLieuLichThi } from "../../domain/exam.js";
import type { KhoLichThi } from "../ports/exam.repository.js";

export type LenhXacNhanImportLichThi = {
  actorId: string;
  items: DuLieuImportLichThi[];
  replaceExistingExams?: boolean;
};

type PhuThuoc = {
  khoLichThi: KhoLichThi;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyXacNhanImportLichThi {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXacNhanImportLichThi) {
    if (command.items.length === 0) {
      throw LoiUngDung.yeuCauSai("Không có dòng lịch thi hợp lệ để import");
    }

    for (const item of command.items) {
      const monHoc = await this.deps.khoLichThi.timMonHocCuaSinhVien(item.maMonHoc, command.actorId);

      if (!monHoc) {
        throw LoiUngDung.khongTimThay("Môn học này chưa có trong hệ thống");
      }
    }

    const dsMaMonHoc = [...new Set(command.items.map((item) => item.maMonHoc))];
    let soLichThiHienCo = 0;

    for (const maMonHoc of dsMaMonHoc) {
      const lichThiHienCo = await this.deps.khoLichThi.lietKeTheoSinhVien(command.actorId, { maMonHoc });
      soLichThiHienCo += lichThiHienCo.length;
    }

    if (soLichThiHienCo > 0 && command.replaceExistingExams !== true) {
      throw LoiUngDung.xungDot("Có môn học đã có lịch thi, cần xác nhận ghi đè dữ liệu", {
        reasonCode: "EXAM_ALREADY_EXISTS",
        soLichThiHienCo,
        dsMaMonHoc
      });
    }

    try {
      const ketQua = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const soLichThiGhiDe =
          command.replaceExistingExams === true ? await this.deps.khoLichThi.xoaTheoMonHoc(dsMaMonHoc, tx) : 0;
        const dsCanLuu: DuLieuLichThi[] = command.items.map((item) => ({
          maMonHoc: item.maMonHoc,
          thoiGianThi: item.thoiGianThi,
          phongThi: item.phongThi,
          diaDiemThi: item.diaDiemThi
        }));
        const dsDaLuu = await this.deps.khoLichThi.taoNhieu(dsCanLuu, tx);

        for (const lichThi of dsDaLuu) {
          await this.deps.khoLichThi.taoNhacNhoTruocMotNgay(command.actorId, lichThi.maLichThi, lichThi.thoiGianThi, tx);
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "EXAM_IMPORTED",
            tableName: "lich_thi",
            message: "Sinh viên import lịch thi bằng AI mapping",
            metadata: {
              soDongImport: command.items.length,
              soDongDaLuu: dsDaLuu.length,
              soLichThiGhiDe
            }
          },
          tx
        );

        return dsDaLuu;
      });

      return {
        message: "Import lịch thi thành công",
        importedCount: ketQua.length,
        replacedExamCount: command.replaceExistingExams === true ? soLichThiHienCo : 0,
        items: ketQua
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể import lịch thi lúc này");
    }
  }
}
