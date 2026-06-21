import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type {
  DongImportThoiKhoaBieu,
  DongPreviewImportThoiKhoaBieu,
  DuLieuImportLichHoc,
  DuLieuLichHoc,
  MappingCotImportThoiKhoaBieu
} from "../../domain/schedule.js";
import { timXungDotTrongLo } from "../services/schedule-conflict.service.js";
import type { DichVuMappingImportThoiKhoaBieu } from "../services/schedule-import-mapper.service.js";
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
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class XuLyPreviewImportThoiKhoaBieu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhPreviewImportThoiKhoaBieu) {
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

        if (monHocPhuHop.length === 0) {
          loi.push("Không tìm thấy môn học tương ứng trong dữ liệu của sinh viên");
        } else if (monHocPhuHop.length > 1) {
          loi.push("Môn học khớp nhiều kết quả, vui lòng chọn học kỳ hoặc map bằng mã môn học chính xác");
        } else {
          const monHoc = monHocPhuHop[0];
          lichHoc = {
            rowIndex,
            maMonHoc: monHoc.maMonHoc,
            maMon: monHoc.maMon,
            tenMon: monHoc.tenMon,
            thu: chuanHoa.thu,
            tietBatDau: chuanHoa.tietBatDau,
            soTiet: chuanHoa.soTiet,
            phongHoc: chuanHoa.phongHoc ?? null,
            ngayBatDau: chuanHoa.ngayBatDau ?? null,
            ngayKetThuc: chuanHoa.ngayKetThuc ?? null
          };
        }
      }

      const xungDot = lichHoc
        ? await this.deps.khoLichHoc.timXungDot(command.actorId, this.layDuLieuLichHoc(lichHoc))
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
      .filter((item): item is DongPreviewImportThoiKhoaBieu & { lichHoc: DuLieuImportLichHoc } => Boolean(item.lichHoc))
      .map((item) => ({
        ...this.layDuLieuLichHoc(item.lichHoc),
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

    return {
      message: soDongLoi > 0 ? "Preview thời khóa biểu có dòng cần kiểm tra" : "Preview thời khóa biểu hợp lệ",
      totalRows: preview.length,
      validRows: soDongHopLe,
      invalidRows: soDongLoi,
      hasOverlap: preview.some((item) => item.trungLich),
      items: preview
    };
  }

  private layDuLieuLichHoc(item: DuLieuImportLichHoc): DuLieuLichHoc {
    return {
      maMonHoc: item.maMonHoc,
      thu: item.thu,
      tietBatDau: item.tietBatDau,
      soTiet: item.soTiet,
      phongHoc: item.phongHoc,
      ngayBatDau: item.ngayBatDau,
      ngayKetThuc: item.ngayKetThuc
    };
  }
}
