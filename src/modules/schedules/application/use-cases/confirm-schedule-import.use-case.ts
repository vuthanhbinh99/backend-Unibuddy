import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoHocPhan } from "../../../courses/application/ports/course.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DuLieuImportLichHoc, DuLieuLichHoc } from "../../domain/schedule.js";
import { kiemTraDuLieuLichHocHopLe, timXungDotTrongLo } from "../services/schedule-conflict.service.js";
import type { DichVuGhiLogLoiThoiKhoaBieu } from "../services/schedule-error-logger.service.js";
import { taoChiTietImportThatBaiChoNhapThuCong } from "../services/schedule-manual-entry-fallback.service.js";
import type { KhoLichHoc } from "../ports/schedule.repository.js";

export type LenhXacNhanImportThoiKhoaBieu = {
  actorId: string;
  maHocKy?: string | null;
  items: DuLieuImportLichHoc[];
};

type PhuThuoc = {
  khoLichHoc: KhoLichHoc;
  khoHocPhan: KhoHocPhan;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiThoiKhoaBieu: DichVuGhiLogLoiThoiKhoaBieu;
};

const MA_MON_HOC_TAM_CHO_IMPORT = "00000000-0000-0000-0000-000000000000";

export class XuLyXacNhanImportThoiKhoaBieu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXacNhanImportThoiKhoaBieu) {
    if (command.items.length === 0) {
      await this.ghiCanhBaoImport(command, "SCHEDULE_IMPORT_EMPTY_ITEMS", "Sinh vien xac nhan import TKB that bai vi khong co dong hop le", {
        reasonCode: "EMPTY_ITEMS"
      });
      throw LoiUngDung.yeuCauSai(
        "Không có dòng lịch học hợp lệ để import",
        taoChiTietImportThatBaiChoNhapThuCong("CONFIRM_IMPORT", { reasonCode: "EMPTY_ITEMS" })
      );
    }

    const dsLichHocKiemTra = command.items.map((item) => this.layDuLieuLichHocKiemTra(item));
    const coDongCanTuDongTaoMonHoc = command.items.some((item) => !item.maMonHoc);

    if (coDongCanTuDongTaoMonHoc) {
      await this.kiemTraHocKyImport(command);
    }

    for (const [index, item] of command.items.entries()) {
      const rowIndex = item.rowIndex;
      const loiDuLieu = kiemTraDuLieuLichHocHopLe(dsLichHocKiemTra[index]);

      if (loiDuLieu.length > 0) {
        await this.ghiCanhBaoImport(command, "SCHEDULE_IMPORT_ROW_INVALID", "Sinh vien xac nhan import TKB that bai vi dong du lieu khong hop le", {
          rowIndex,
          errors: loiDuLieu
        });
        throw LoiUngDung.yeuCauSai(
          `Dòng ${rowIndex} không hợp lệ`,
          taoChiTietImportThatBaiChoNhapThuCong("CONFIRM_IMPORT", { rowIndex, errors: loiDuLieu })
        );
      }

      if (item.maMonHoc) {
        const monHocHopLe = await this.deps.khoLichHoc.kiemTraMonHocThuocSinhVien(item.maMonHoc, command.actorId);

        if (!monHocHopLe) {
          await this.ghiCanhBaoImport(command, "SCHEDULE_IMPORT_COURSE_FORBIDDEN", "Sinh vien xac nhan import TKB that bai vi mon hoc khong thuoc sinh vien", {
            rowIndex,
            maMonHoc: item.maMonHoc
          });
          throw new LoiUngDung(
            403,
            CacLoi.FORBIDDEN,
            `Dòng ${rowIndex} có môn học không thuộc sinh viên`,
            taoChiTietImportThatBaiChoNhapThuCong("CONFIRM_IMPORT", { rowIndex, maMonHoc: item.maMonHoc })
          );
        }
      } else if (!item.tenMon.trim() && !item.maMon?.trim()) {
        await this.ghiCanhBaoImport(command, "SCHEDULE_IMPORT_COURSE_INFO_MISSING", "Sinh vien xac nhan import TKB that bai vi thieu ten hoac ma mon de tu tao mon hoc", {
          rowIndex
        });
        throw LoiUngDung.yeuCauSai(
          `Dòng ${rowIndex} thiếu tên hoặc mã môn để tự tạo môn học`,
          taoChiTietImportThatBaiChoNhapThuCong("CONFIRM_IMPORT", { rowIndex })
        );
      }
    }

    const xungDotTrongLo = timXungDotTrongLo(command.items);

    if (xungDotTrongLo.size > 0) {
      await this.ghiCanhBaoImport(command, "SCHEDULE_IMPORT_FILE_CONFLICT", "Sinh vien xac nhan import TKB that bai vi cac dong trong file bi trung lich BR-SCH-01", {
        ruleCode: "BR-SCH-01",
        rows: Array.from(xungDotTrongLo.entries()).map(([rowIndex, conflicts]) => ({ rowIndex, conflicts }))
      });
      throw LoiUngDung.xungDot(
        "Phát hiện có dòng bị trùng lịch học trong file import",
        taoChiTietImportThatBaiChoNhapThuCong("CONFIRM_IMPORT", {
          ruleCode: "BR-SCH-01",
          rows: Array.from(xungDotTrongLo.entries()).map(([rowIndex, conflicts]) => ({ rowIndex, conflicts }))
        })
      );
    }

    const xungDotDatabase = [];

    for (const [index, item] of dsLichHocKiemTra.entries()) {
      const xungDot = await this.deps.khoLichHoc.timXungDot(command.actorId, item);

      if (xungDot.length > 0) {
        xungDotDatabase.push({
          rowIndex: command.items[index].rowIndex,
          xungDot
        });
      }
    }

    if (xungDotDatabase.length > 0) {
      await this.ghiCanhBaoImport(command, "SCHEDULE_IMPORT_DATABASE_CONFLICT", "Sinh vien xac nhan import TKB that bai vi trung lich voi du lieu hien co BR-SCH-01", {
        ruleCode: "BR-SCH-01",
        xungDot: xungDotDatabase
      });
      throw LoiUngDung.xungDot(
        "Phát hiện có dòng bị trùng lịch học, vui lòng quay lại kiểm tra preview",
        taoChiTietImportThatBaiChoNhapThuCong("CONFIRM_IMPORT", {
          ruleCode: "BR-SCH-01",
          xungDot: xungDotDatabase
        })
      );
    }

    try {
      const ketQua = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const dsCanLuu: DuLieuLichHoc[] = [];
        let soMonHocTuDongTao = 0;

        for (const item of command.items) {
          let maMonHoc = item.maMonHoc;

          if (!maMonHoc) {
            if (!command.maHocKy) {
              await this.ghiCanhBaoImport(command, "SCHEDULE_IMPORT_SEMESTER_REQUIRED", "Sinh vien xac nhan import TKB that bai vi chua chon hoc ky de tu tao mon hoc", {
                reasonCode: "SEMESTER_REQUIRED",
                rowIndex: item.rowIndex
              });
              throw LoiUngDung.yeuCauSai(
                "Cần chọn học kỳ để hệ thống tự tạo môn học trước khi import thời khóa biểu",
                taoChiTietImportThatBaiChoNhapThuCong("CONFIRM_IMPORT", { reasonCode: "SEMESTER_REQUIRED" })
              );
            }

            const ketQuaMonHoc = await this.deps.khoHocPhan.timHoacTaoChoImport(
              {
                actorId: command.actorId,
                maHocKy: command.maHocKy,
                maMon: item.maMon,
                tenMon: item.tenMon.trim(),
                soTinChi: item.soTinChi
              },
              tx
            );

            maMonHoc = ketQuaMonHoc.monHoc.maMonHoc;

            if (ketQuaMonHoc.daTao) {
              soMonHocTuDongTao += 1;
            }
          }

          dsCanLuu.push({
            maMonHoc,
            thu: item.thu,
            tietBatDau: item.tietBatDau,
            soTiet: item.soTiet,
            phongHoc: item.phongHoc,
            ngayBatDau: item.ngayBatDau,
            ngayKetThuc: item.ngayKetThuc
          });
        }

        const dsDaLuu = await this.deps.khoLichHoc.taoNhieu(dsCanLuu, tx);

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "SCHEDULE_IMPORTED",
            tableName: "lich_hoc",
            message: "Sinh viên import TKB tự động bằng Khớp cột thành công",
            metadata: {
              maHocKy: command.maHocKy ?? null,
              soDongImport: command.items.length,
              soDongDaLuu: dsDaLuu.length,
              soMonHocTuDongTao,
              ruleCode: "BR-SCH-01"
            }
          },
          tx
        );

        return {
          lichHoc: dsDaLuu,
          soMonHocTuDongTao
        };
      });

      return {
        message: "Đồng bộ thành công! Thời khóa biểu của bạn đã được cập nhật.",
        importedCount: ketQua.lichHoc.length,
        autoCreatedCourseCount: ketQua.soMonHocTuDongTao,
        items: ketQua.lichHoc
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghi({
        actorId: command.actorId,
        action: "SCHEDULE_IMPORT_FAILED",
        tableName: "lich_hoc",
        message: "Lỗi import thời khóa biểu vào database",
        error,
        metadata: {
          maHocKy: command.maHocKy ?? null,
          soDongImport: command.items.length
        }
      });
      throw new LoiUngDung(
        500,
        CacLoi.INTERNAL_ERROR,
        "Hệ thống bận, không thể import thời khóa biểu lúc này",
        taoChiTietImportThatBaiChoNhapThuCong("CONFIRM_IMPORT", { soDongImport: command.items.length })
      );
    }
  }

  private async kiemTraHocKyImport(command: LenhXacNhanImportThoiKhoaBieu) {
    if (!command.maHocKy) {
      await this.ghiCanhBaoImport(command, "SCHEDULE_IMPORT_SEMESTER_REQUIRED", "Sinh vien xac nhan import TKB that bai vi chua chon hoc ky de tu tao mon hoc", {
        reasonCode: "SEMESTER_REQUIRED"
      });
      throw LoiUngDung.yeuCauSai(
        "Cần chọn học kỳ để hệ thống tự tạo môn học trước khi import thời khóa biểu",
        taoChiTietImportThatBaiChoNhapThuCong("CONFIRM_IMPORT", { reasonCode: "SEMESTER_REQUIRED" })
      );
    }

    const hocKy = await this.deps.khoHocPhan.timHocKyCuaSinhVien(command.maHocKy, command.actorId);

    if (!hocKy) {
      await this.ghiCanhBaoImport(command, "SCHEDULE_IMPORT_SEMESTER_FORBIDDEN", "Sinh vien xac nhan import TKB that bai vi hoc ky khong thuoc sinh vien", {
        maHocKy: command.maHocKy
      });
      throw new LoiUngDung(
        403,
        CacLoi.FORBIDDEN,
        "Học kỳ import không thuộc sinh viên",
        taoChiTietImportThatBaiChoNhapThuCong("CONFIRM_IMPORT", { maHocKy: command.maHocKy })
      );
    }
  }

  private async ghiCanhBaoImport(
    command: LenhXacNhanImportThoiKhoaBieu,
    action: string,
    message: string,
    metadata: Record<string, unknown>
  ) {
    await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghiCanhBao({
      actorId: command.actorId,
      action,
      tableName: "lich_hoc",
      message,
      metadata: {
        maHocKy: command.maHocKy ?? null,
        soDongImport: command.items.length,
        stage: "CONFIRM_IMPORT",
        ...metadata
      }
    });
  }

  private layDuLieuLichHocKiemTra(item: DuLieuImportLichHoc): DuLieuLichHoc {
    return {
      maMonHoc: item.maMonHoc ?? MA_MON_HOC_TAM_CHO_IMPORT,
      thu: item.thu,
      tietBatDau: item.tietBatDau,
      soTiet: item.soTiet,
      phongHoc: item.phongHoc,
      ngayBatDau: item.ngayBatDau,
      ngayKetThuc: item.ngayKetThuc
    };
  }
}
