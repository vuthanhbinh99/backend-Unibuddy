import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DuLieuImportDiemSo } from "../../domain/grade.js";
import type { KhoDiemSo } from "../ports/grade.repository.js";
import type { DichVuGhiLogLoiDiemSo } from "../services/grade-error-logger.service.js";
import {
  taoChiTietImportDiemThatBaiChoNhapThuCong,
  taoChiTietImportDiemThieuMonHoc,
  THONG_BAO_IMPORT_DIEM_THIEU_MON_HOC
} from "../services/grade-import-manual-fallback.service.js";
import { chuanHoaMaMon, chuanHoaTenThanhPhan, hocKyDaKetThuc, laDiemHopLe, laTrongSoHopLe } from "./grade-use-case.helpers.js";

export type LenhXacNhanImportDiemSo = {
  actorId: string;
  maHocKy?: string | null;
  items: DuLieuImportDiemSo[];
};

type DuLieuImportDiemSoDaXacThuc = DuLieuImportDiemSo & {
  maMonHoc: string;
};

type PhuThuoc = {
  khoDiemSo: KhoDiemSo;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiDiemSo: DichVuGhiLogLoiDiemSo;
};

export class XuLyXacNhanImportDiemSo {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhXacNhanImportDiemSo) {
    const maHocKy = await this.kiemTraHocKyImport(command);
    const items = await this.kiemTraItems(command, maHocKy);

    try {
      const ketQua = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        let soThanhPhanTaoMoi = 0;
        let soThanhPhanCapNhat = 0;
        const thanhPhanDaLuu = [];

        for (const item of items) {
          const thanhPhanHienTai = await this.deps.khoDiemSo.timThanhPhanTheoTen(item.maMonHoc, item.tenThanhPhan, tx);
          const thanhPhan = await this.deps.khoDiemSo.upsertThanhPhan(
            {
              maMonHoc: item.maMonHoc,
              tenThanhPhan: item.tenThanhPhan,
              trongSo: item.trongSo,
              diem: item.diem
            },
            tx
          );

          if (thanhPhanHienTai) {
            soThanhPhanCapNhat += 1;
          } else {
            soThanhPhanTaoMoi += 1;
          }

          thanhPhanDaLuu.push(thanhPhan);
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "GRADE_IMPORTED",
            tableName: "thanh_phan_diem",
            recordId: maHocKy,
            message: "Sinh viên import bảng điểm thành công",
            metadata: {
              maHocKy,
              soDongImport: items.length,
              soDongDaLuu: thanhPhanDaLuu.length,
              soThanhPhanTaoMoi,
              soThanhPhanCapNhat,
              upsert: true,
              autoCreateCourse: false,
              ruleCodes: ["BR-EDU-02", "BR-EDU-03"]
            }
          },
          tx
        );

        return {
          thanhPhanDaLuu,
          soThanhPhanTaoMoi,
          soThanhPhanCapNhat
        };
      });

      return {
        message: "Import điểm số thành công. Các đầu điểm đã có được cập nhật.",
        importedCount: ketQua.thanhPhanDaLuu.length,
        createdGradeComponentCount: ketQua.soThanhPhanTaoMoi,
        updatedGradeComponentCount: ketQua.soThanhPhanCapNhat,
        items: ketQua.thanhPhanDaLuu
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiDiemSo.ghi({
        actorId: command.actorId,
        action: "GRADE_IMPORT_FAILED",
        tableName: "thanh_phan_diem",
        message: "Lỗi import điểm số vào database",
        error,
        metadata: {
          maHocKy,
          soDongImport: items.length
        }
      });
      throw new LoiUngDung(
        500,
        CacLoi.INTERNAL_ERROR,
        "Hệ thống bận, không thể import điểm số lúc này",
        taoChiTietImportDiemThatBaiChoNhapThuCong("CONFIRM_IMPORT", { soDongImport: items.length })
      );
    }
  }

  private async kiemTraHocKyImport(command: LenhXacNhanImportDiemSo) {
    if (!command.maHocKy) {
      await this.ghiCanhBaoImport(command, "GRADE_IMPORT_SEMESTER_REQUIRED", {
        reasonCode: "SEMESTER_REQUIRED"
      });
      throw LoiUngDung.yeuCauSai(
        "Cần chọn học kỳ trước khi import điểm số",
        taoChiTietImportDiemThatBaiChoNhapThuCong("CONFIRM_IMPORT", { reasonCode: "SEMESTER_REQUIRED" })
      );
    }

    const hocKy = await this.deps.khoDiemSo.timHocKyCuaSinhVien(command.maHocKy, command.actorId);

    if (!hocKy) {
      await this.ghiCanhBaoImport(command, "GRADE_IMPORT_SEMESTER_FORBIDDEN", {
        maHocKy: command.maHocKy
      });
      throw new LoiUngDung(
        403,
        CacLoi.FORBIDDEN,
        "Học kỳ import không thuộc sinh viên",
        taoChiTietImportDiemThatBaiChoNhapThuCong("CONFIRM_IMPORT", { maHocKy: command.maHocKy })
      );
    }

    if (!hocKyDaKetThuc(hocKy)) {
      await this.ghiCanhBaoImport(command, "GRADE_IMPORT_CURRENT_SEMESTER_REJECTED", {
        maHocKy: command.maHocKy,
        tenHocKy: hocKy.tenHocKy,
        ngayKetThuc: hocKy.ngayKetThuc,
        stage: "CURRENT_SEMESTER"
      });
      throw LoiUngDung.khongTheXuLy(
        "Học kỳ hiện tại chưa đủ điểm, vui lòng nhập điểm thủ công",
        taoChiTietImportDiemThatBaiChoNhapThuCong("CURRENT_SEMESTER", { maHocKy: command.maHocKy })
      );
    }

    return command.maHocKy;
  }

  private async kiemTraItems(command: LenhXacNhanImportDiemSo, maHocKy: string): Promise<DuLieuImportDiemSoDaXacThuc[]> {
    if (command.items.length === 0) {
      await this.ghiCanhBaoImport(command, "GRADE_IMPORT_EMPTY_ITEMS", {
        reasonCode: "EMPTY_ITEMS"
      });
      throw LoiUngDung.yeuCauSai(
        "Không có dòng điểm hợp lệ để import",
        taoChiTietImportDiemThatBaiChoNhapThuCong("CONFIRM_IMPORT", { reasonCode: "EMPTY_ITEMS" })
      );
    }

    const items: DuLieuImportDiemSoDaXacThuc[] = [];

    for (const item of command.items) {
      const tenThanhPhan = chuanHoaTenThanhPhan(item.tenThanhPhan);
      const tenMon = item.tenMon?.trim() ?? "";
      const loi: string[] = [];
      let maMonHoc = item.maMonHoc;

      if (!maMonHoc) {
        loi.push(THONG_BAO_IMPORT_DIEM_THIEU_MON_HOC);
      } else {
        const monHoc = await this.deps.khoDiemSo.timMonHocCuaSinhVien(maMonHoc, command.actorId);

        if (!monHoc || monHoc.maHocKy !== maHocKy) {
          loi.push(THONG_BAO_IMPORT_DIEM_THIEU_MON_HOC);
        }
      }

      if (!tenThanhPhan) {
        loi.push("Tên thành phần điểm không được để trống");
      }

      if (!laTrongSoHopLe(item.trongSo)) {
        loi.push("Trọng số phải lớn hơn 0 và không vượt quá 100");
      }

      if (!laDiemHopLe(item.diem)) {
        loi.push("Điểm số phải nằm trong khoảng 0 đến 10");
      }

      if (loi.length > 0) {
        await this.ghiCanhBaoImport(command, "GRADE_IMPORT_ROW_INVALID", {
          rowIndex: item.rowIndex,
          errors: loi
        });

        const thieuMonHoc = loi.includes(THONG_BAO_IMPORT_DIEM_THIEU_MON_HOC);
        const chiTiet = thieuMonHoc
          ? taoChiTietImportDiemThieuMonHoc("COURSE_MISSING", {
              rowIndex: item.rowIndex,
              maHocKy,
              errors: loi
            })
          : taoChiTietImportDiemThatBaiChoNhapThuCong("CONFIRM_IMPORT", {
              rowIndex: item.rowIndex,
              errors: loi
            });

        throw LoiUngDung.yeuCauSai(thieuMonHoc ? THONG_BAO_IMPORT_DIEM_THIEU_MON_HOC : `Dòng ${item.rowIndex} không hợp lệ`, chiTiet);
      }

      maMonHoc = maMonHoc as string;

      items.push({
        ...item,
        maMonHoc,
        maMon: chuanHoaMaMon(item.maMon),
        tenMon: tenMon || item.maMon?.trim() || "Môn học chưa đặt tên",
        tenThanhPhan,
        tuDongTaoMonHoc: false
      });
    }

    return items;
  }

  private async ghiCanhBaoImport(
    command: LenhXacNhanImportDiemSo,
    action: string,
    metadata: Record<string, unknown>
  ) {
    await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
      actorId: command.actorId,
      action,
      tableName: "thanh_phan_diem",
      message: "Sinh viên import điểm thất bại, hệ thống hướng dẫn sinh viên xử lý đúng module nghiệp vụ",
      metadata: {
        maHocKy: command.maHocKy ?? null,
        soDongImport: command.items.length,
        stage: "CONFIRM_IMPORT",
        ...metadata
      }
    });
  }
}
