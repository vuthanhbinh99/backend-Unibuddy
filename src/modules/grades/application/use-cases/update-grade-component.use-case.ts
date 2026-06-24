import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KetQuaTinhMonHoc, ThanhPhanDiem } from "../../domain/grade.js";
import type { KhoDiemSo } from "../ports/grade.repository.js";
import { tinhKetQuaMonHoc } from "../services/grade-calculation.service.js";
import type { DichVuGhiLogLoiDiemSo } from "../services/grade-error-logger.service.js";
import { laDiemHopLe } from "./grade-use-case.helpers.js";

export type LenhCapNhatThanhPhanDiem = {
  actorId: string;
  maThanhPhan: string;
  diem?: number | null;
};

type PhuThuoc = {
  khoDiemSo: KhoDiemSo;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiDiemSo: DichVuGhiLogLoiDiemSo;
};

export class XuLyCapNhatThanhPhanDiem {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatThanhPhanDiem) {
    const diem = await this.kiemTraDiem(command);
    const hienTai = await this.deps.khoDiemSo.timThanhPhanCuaSinhVien(command.maThanhPhan, command.actorId);

    if (!hienTai) {
      await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
        actorId: command.actorId,
        action: "GRADE_COMPONENT_UPDATE_NOT_FOUND",
        tableName: "thanh_phan_diem",
        recordId: command.maThanhPhan,
        message: "Sinh viên cập nhật điểm thất bại vì không tìm thấy dữ liệu điểm số yêu cầu",
        metadata: {
          maThanhPhan: command.maThanhPhan
        }
      });
      throw LoiUngDung.khongTimThay("Không tìm thấy dữ liệu điểm số yêu cầu");
    }

    try {
      const thanhPhan = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const daCapNhat = await this.deps.khoDiemSo.capNhatDiem(command.maThanhPhan, diem, tx);

        if (!daCapNhat) {
          throw LoiUngDung.khongTimThay("Không tìm thấy dữ liệu điểm số yêu cầu");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "GRADE_COMPONENT_UPDATED",
            tableName: "thanh_phan_diem",
            recordId: command.maThanhPhan,
            message: "Sinh viên cập nhật điểm số thành phần thành công",
            metadata: {
              maMonHoc: hienTai.maMonHoc,
              maMon: hienTai.monHoc.maMon,
              tenMon: hienTai.monHoc.tenMon,
              tenThanhPhan: hienTai.tenThanhPhan,
              diemCu: hienTai.diem,
              diemMoi: diem,
              ruleCode: "BR-EDU-03"
            }
          },
          tx
        );

        return daCapNhat;
      });

      return {
        message: "Cập nhật điểm số và điểm tổng kết môn học thành công!",
        thanhPhan,
        ketQuaMonHoc: await this.tinhKetQuaMonHoc(command.actorId, hienTai.maMonHoc)
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiDiemSo.ghi({
        actorId: command.actorId,
        action: "GRADE_COMPONENT_UPDATE_FAILED",
        tableName: "thanh_phan_diem",
        recordId: command.maThanhPhan,
        message: "Lỗi cập nhật điểm thành phần",
        error,
        metadata: {
          maThanhPhan: command.maThanhPhan,
          diem
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Không thể cập nhật điểm số, vui lòng thử lại sau!");
    }
  }

  private async kiemTraDiem(command: LenhCapNhatThanhPhanDiem) {
    if (!laDiemHopLe(command.diem)) {
      await this.deps.dichVuGhiLogLoiDiemSo.ghiCanhBao({
        actorId: command.actorId,
        action: "GRADE_COMPONENT_UPDATE_VALIDATION_FAILED",
        tableName: "thanh_phan_diem",
        recordId: command.maThanhPhan,
        message: "Sinh viên cập nhật điểm thất bại do điểm số không hợp lệ",
        metadata: {
          maThanhPhan: command.maThanhPhan,
          diem: command.diem
        }
      });
      throw LoiUngDung.yeuCauSai("Điểm số cập nhật phải từ 0.0 đến 10.0");
    }

    return command.diem;
  }

  private async tinhKetQuaMonHoc(actorId: string, maMonHoc: string): Promise<KetQuaTinhMonHoc> {
    const [thanhPhan, maTruongCode] = await Promise.all([
      this.deps.khoDiemSo.lietKeThanhPhanTheoMon(maMonHoc),
      this.deps.khoDiemSo.layMaTruongCodeSinhVien(actorId)
    ]);
    const thangDiem = maTruongCode ? await this.deps.khoDiemSo.layThangDiem(maTruongCode) : [];

    return tinhKetQuaMonHoc(thanhPhan as ThanhPhanDiem[], thangDiem);
  }
}
