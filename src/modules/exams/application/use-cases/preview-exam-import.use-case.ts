import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type {
  DongImportLichThi,
  DongPreviewImportLichThi,
  DuLieuImportLichThi,
  MappingCotImportLichThi
} from "../../domain/exam.js";
import type { KhoLichThi } from "../ports/exam.repository.js";
import {
  boSungMappingCotImportLichThi,
  type DichVuMappingImportLichThi
} from "../services/exam-import-mapper.service.js";

export type LenhPreviewImportLichThi = {
  actorId: string;
  maHocKy?: string | null;
  rows: DongImportLichThi[];
  mapping: MappingCotImportLichThi;
};

type PhuThuoc = {
  khoLichThi: KhoLichThi;
  dichVuMappingImportLichThi: DichVuMappingImportLichThi;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOI_MON_HOC_CHUA_CO = "Môn học này chưa có trong hệ thống";

export class XuLyPreviewImportLichThi {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhPreviewImportLichThi) {
    if (command.rows.length === 0) {
      throw LoiUngDung.yeuCauSai("Không có dòng dữ liệu lịch thi để xem trước");
    }

    const headers = [
      ...new Set(command.rows.flatMap((row) => Object.keys(row)).filter((header) => header.trim().length > 0))
    ];
    const mapping = boSungMappingCotImportLichThi(command.mapping, headers);
    const loiMapping = this.deps.dichVuMappingImportLichThi.kiemTraMapping(mapping);

    const preview: DongPreviewImportLichThi[] = [];

    for (const [index, row] of command.rows.entries()) {
      const rowIndex = index + 2;
      const soCotCoDuLieu = Object.values(row).filter((value) => String(value ?? "").trim() !== "").length;

      if (soCotCoDuLieu < 3) {
        continue;
      }

      const chuanHoa = this.deps.dichVuMappingImportLichThi.chuanHoaDong(row, mapping, rowIndex);
      const loi = [...chuanHoa.loi];

      if (loiMapping.length > 0) {
        loi.push(...loiMapping);
      }

      if (chuanHoa.maMonHoc && !UUID_PATTERN.test(chuanHoa.maMonHoc)) {
        loi.push("Mã môn học không đúng định dạng UUID");
      }

      let lichThi: DuLieuImportLichThi | null = null;
      let daCoLichThi = false;

      if (loi.length === 0 && chuanHoa.thoiGianThi) {
        const monHocPhuHop = await this.deps.khoLichThi.timMonHocChoImport({
          maNguoiDung: command.actorId,
          maHocKy: command.maHocKy ?? null,
          maMonHoc: chuanHoa.maMonHoc,
          maMon: chuanHoa.maMon,
          tenMon: chuanHoa.tenMon
        });

        if (monHocPhuHop.length > 1) {
          loi.push("Môn học khớp nhiều kết quả, vui lòng chọn học kỳ hoặc map bằng mã môn chính xác");
        } else if (monHocPhuHop.length === 1) {
          const monHoc = monHocPhuHop[0];
          const lichThiHienCo = await this.deps.khoLichThi.lietKeTheoSinhVien(command.actorId, {
            maMonHoc: monHoc.maMonHoc
          });
          daCoLichThi = lichThiHienCo.length > 0;
          lichThi = {
            rowIndex,
            maMonHoc: monHoc.maMonHoc,
            maMon: monHoc.maMon,
            tenMon: monHoc.tenMon,
            thoiGianThi: chuanHoa.thoiGianThi,
            phongThi: chuanHoa.phongThi ?? null,
            diaDiemThi: chuanHoa.diaDiemThi ?? null
          };
        } else {
          loi.push(LOI_MON_HOC_CHUA_CO);
        }
      }

      preview.push({
        rowIndex,
        hopLe: loi.length === 0,
        loi,
        daCoLichThi,
        lichThi
      });
    }

    const soDongHopLe = preview.filter((item) => item.hopLe).length;
    const soDongLoi = preview.length - soDongHopLe;
    const soDongDaCoLichThi = preview.filter((item) => item.hopLe && item.daCoLichThi).length;

    return {
      message: soDongLoi > 0 ? "Preview lịch thi có dòng cần kiểm tra" : "Preview lịch thi hợp lệ",
      totalRows: preview.length,
      validRows: soDongHopLe,
      invalidRows: soDongLoi,
      existingExamRows: soDongDaCoLichThi,
      hasExistingExam: soDongDaCoLichThi > 0,
      mapping,
      items: preview
    };
  }
}

