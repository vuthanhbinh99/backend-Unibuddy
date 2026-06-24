import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type {
  DongImportThoiKhoaBieu,
  DongPreviewImportThoiKhoaBieu,
  DuLieuImportLichHoc,
  DuLieuLichHoc,
  MappingCotImportThoiKhoaBieu
} from "../../domain/schedule.js";
import { timXungDotTrongLo } from "../services/schedule-conflict.service.js";
import type { DichVuGhiLogLoiThoiKhoaBieu } from "../services/schedule-error-logger.service.js";
import type { DichVuMappingImportThoiKhoaBieu } from "../services/schedule-import-mapper.service.js";
import {
  boSungHuongDanNhapThuCong,
  taoChiTietImportThatBaiChoNhapThuCong,
  taoThongTinNhapThuCongThoiKhoaBieu
} from "../services/schedule-manual-entry-fallback.service.js";
import type { KhoLichHoc } from "../ports/schedule.repository.js";

export type LenhPreviewImportThoiKhoaBieu = {
  actorId: string;
  maHocKy?: string | null;
  rows: DongImportThoiKhoaBieu[];
  mapping: MappingCotImportThoiKhoaBieu;
};

type PhuThuoc = {
  khoLichHoc: KhoLichHoc;
  dichVuMappingImportThoiKhoaBieu: DichVuMappingImportThoiKhoaBieu;
  dichVuGhiLogLoiThoiKhoaBieu: DichVuGhiLogLoiThoiKhoaBieu;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MA_MON_HOC_TAM_CHO_IMPORT = "00000000-0000-0000-0000-000000000000";

export class XuLyPreviewImportThoiKhoaBieu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhPreviewImportThoiKhoaBieu) {
    try {
      return await this.taoPreview(command);
    } catch (error) {
      if (error instanceof LoiUngDung) {
        await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghiCanhBao({
          actorId: command.actorId,
          action: "SCHEDULE_IMPORT_PREVIEW_REJECTED",
          tableName: "lich_hoc",
          message: "Sinh vien xem truoc import TKB that bai vi du lieu preview khong hop le",
          metadata: {
            soDongNguon: command.rows.length,
            maHocKy: command.maHocKy ?? null,
            stage: "PREVIEW_IMPORT",
            errorMessage: error.message
          }
        });
        throw boSungHuongDanNhapThuCong(error, "PREVIEW_IMPORT");
      }

      await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghi({
        actorId: command.actorId,
        action: "SCHEDULE_IMPORT_PREVIEW_FAILED",
        message: "Lỗi tạo preview import thời khóa biểu",
        error,
        metadata: {
          soDongNguon: command.rows.length,
          maHocKy: command.maHocKy ?? null
        }
      });

      throw new LoiUngDung(
        500,
        CacLoi.INTERNAL_ERROR,
        "Hệ thống bận, không thể xem trước thời khóa biểu import lúc này",
        taoChiTietImportThatBaiChoNhapThuCong("PREVIEW_IMPORT", {
          soDongNguon: command.rows.length,
          maHocKy: command.maHocKy ?? null
        })
      );
    }
  }

  private async taoPreview(command: LenhPreviewImportThoiKhoaBieu) {
    if (command.rows.length === 0) {
      throw LoiUngDung.yeuCauSai("Không có dòng dữ liệu thời khóa biểu để xem trước");
    }

    const loiMapping = this.deps.dichVuMappingImportThoiKhoaBieu.kiemTraMapping(command.mapping);

    if (loiMapping.length > 0) {
      throw LoiUngDung.yeuCauSai("Cấu hình map cột import thời khóa biểu không hợp lệ", loiMapping);
    }

    const preview: DongPreviewImportThoiKhoaBieu[] = [];

    for (const [index, row] of command.rows.entries()) {
      const rowIndex = index + 2;
      const chuanHoa = this.deps.dichVuMappingImportThoiKhoaBieu.chuanHoaDong(row, command.mapping, rowIndex);
      const loi = [...chuanHoa.loi];

      if (chuanHoa.maMonHoc && !UUID_PATTERN.test(chuanHoa.maMonHoc)) {
        loi.push("Mã môn học không đúng định dạng UUID");
      }

      let lichHoc: DuLieuImportLichHoc | null = null;

      if (loi.length === 0 && chuanHoa.thu && chuanHoa.tietBatDau && chuanHoa.soTiet) {
        const monHocPhuHop = await this.deps.khoLichHoc.timMonHocChoImport({
          maNguoiDung: command.actorId,
          maHocKy: command.maHocKy ?? null,
          maMonHoc: chuanHoa.maMonHoc ?? null,
          maMon: chuanHoa.maMon,
          tenMon: chuanHoa.tenMon
        });

        if (monHocPhuHop.length > 1) {
          loi.push("Môn học khớp nhiều kết quả, vui lòng chọn học kỳ hoặc map bằng mã môn học chính xác");
        } else if (monHocPhuHop.length === 1) {
          const monHoc = monHocPhuHop[0];
          lichHoc = {
            rowIndex,
            maMonHoc: monHoc.maMonHoc,
            maMon: monHoc.maMon,
            tenMon: monHoc.tenMon,
            soTinChi: monHoc.soTinChi,
            tuDongTaoMonHoc: false,
            thu: chuanHoa.thu,
            tietBatDau: chuanHoa.tietBatDau,
            soTiet: chuanHoa.soTiet,
            phongHoc: chuanHoa.phongHoc ?? null,
            ngayBatDau: chuanHoa.ngayBatDau ?? null,
            ngayKetThuc: chuanHoa.ngayKetThuc ?? null
          };
        } else {
          lichHoc = this.taoDongLichHocChoMonHocTuDong(command.maHocKy ?? null, rowIndex, chuanHoa, loi);
        }
      }

      const xungDot = lichHoc
        ? await this.deps.khoLichHoc.timXungDot(command.actorId, this.layDuLieuLichHocKiemTra(lichHoc))
        : [];

      if (xungDot.length > 0) {
        loi.push(`Trùng lịch học với ${xungDot.map((item) => item.tenMon).join(", ")}`);
      }

      preview.push({
        rowIndex,
        hopLe: loi.length === 0,
        trungLich: xungDot.length > 0,
        loi,
        lichHoc,
        xungDot
      });
    }

    const loHopLe = preview
      .filter((item): item is DongPreviewImportThoiKhoaBieu & { lichHoc: DuLieuImportLichHoc } =>
        Boolean(item.lichHoc && item.hopLe)
      )
      .map((item) => ({
        ...this.layDuLieuLichHocKiemTra(item.lichHoc),
        rowIndex: item.rowIndex
      }));
    const xungDotTrongLo = timXungDotTrongLo(loHopLe);

    for (const item of preview) {
      const cacDongTrung = xungDotTrongLo.get(item.rowIndex);

      if (!cacDongTrung || cacDongTrung.length === 0) {
        continue;
      }

      item.trungLich = true;
      item.hopLe = false;
      item.loi.push(`Trùng lịch với dòng ${cacDongTrung.join(", ")}`);
    }

    const soDongHopLe = preview.filter((item) => item.hopLe).length;
    const soDongLoi = preview.length - soDongHopLe;
    const soMonHocSeTuDongTao = preview.filter((item) => item.lichHoc?.tuDongTaoMonHoc).length;

    if (soDongLoi > 0) {
      await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghiCanhBao({
        actorId: command.actorId,
        action: "SCHEDULE_IMPORT_PREVIEW_HAS_INVALID_ROWS",
        tableName: "lich_hoc",
        message: "Preview import TKB co dong khong hop le, he thong huong dan sinh vien nhap thu cong khi can",
        metadata: {
          soDongNguon: command.rows.length,
          soDongHopLe,
          soDongLoi,
          soMonHocSeTuDongTao,
          maHocKy: command.maHocKy ?? null,
          stage: "PREVIEW_HAS_INVALID_ROWS"
        }
      });
    }

    return {
      message: soDongLoi > 0 ? "Preview thời khóa biểu có dòng cần kiểm tra" : "Preview thời khóa biểu hợp lệ",
      totalRows: preview.length,
      validRows: soDongHopLe,
      invalidRows: soDongLoi,
      autoCreateCourseRows: soMonHocSeTuDongTao,
      hasOverlap: preview.some((item) => item.trungLich),
      manualEntry:
        soDongLoi > 0
          ? taoThongTinNhapThuCongThoiKhoaBieu("PREVIEW_HAS_INVALID_ROWS", { invalidRows: soDongLoi })
          : null,
      items: preview
    };
  }

  private taoDongLichHocChoMonHocTuDong(
    maHocKy: string | null,
    rowIndex: number,
    chuanHoa: {
      maMon: string | null;
      tenMon: string | null;
      soTinChi: number | null;
      thu?: number;
      tietBatDau?: number;
      soTiet?: number;
      phongHoc?: string | null;
      ngayBatDau?: string | null;
      ngayKetThuc?: string | null;
    },
    loi: string[]
  ): DuLieuImportLichHoc | null {
    const tenMonTuDong = chuanHoa.tenMon ?? chuanHoa.maMon;

    if (!maHocKy) {
      loi.push("Không tìm thấy môn học tương ứng; vui lòng chọn học kỳ để hệ thống tự tạo môn học hoặc nhập thủ công");
      return null;
    }

    if (!tenMonTuDong) {
      loi.push("Không tìm thấy môn học tương ứng và thiếu tên hoặc mã môn để tự tạo môn học");
      return null;
    }

    return {
      rowIndex,
      maMonHoc: null,
      maMon: chuanHoa.maMon,
      tenMon: tenMonTuDong,
      soTinChi: chuanHoa.soTinChi,
      tuDongTaoMonHoc: true,
      thu: chuanHoa.thu ?? 0,
      tietBatDau: chuanHoa.tietBatDau ?? 0,
      soTiet: chuanHoa.soTiet ?? 0,
      phongHoc: chuanHoa.phongHoc ?? null,
      ngayBatDau: chuanHoa.ngayBatDau ?? null,
      ngayKetThuc: chuanHoa.ngayKetThuc ?? null
    };
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
