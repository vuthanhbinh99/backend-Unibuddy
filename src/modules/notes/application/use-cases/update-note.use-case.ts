import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DichVuQuyenGhiChu } from "../services/note-access.service.js";
import type { DichVuTepDinhKemGhiChu } from "../services/note-attachment.service.js";
import type { DichVuGhiLogLoiGhiChu } from "../services/note-error-logger.service.js";
import type { KhoGhiChu } from "../ports/note.repository.js";
import type { LenhCapNhatGhiChu } from "./note-use-case.types.js";

type PhuThuoc = {
  khoGhiChu: KhoGhiChu;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuQuyenGhiChu: DichVuQuyenGhiChu;
  dichVuTepDinhKemGhiChu: DichVuTepDinhKemGhiChu;
  dichVuGhiLogLoiGhiChu: DichVuGhiLogLoiGhiChu;
};

export class XuLyCapNhatGhiChu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatGhiChu) {
    const ghiChuHienTai = await this.deps.dichVuQuyenGhiChu.layGhiChuThuocSinhVien(
      command.actorId,
      command.maGhiChu,
      "cập nhật"
    );

    await this.deps.dichVuQuyenGhiChu.kiemTraMonHocNeuCo(
      command.maMonHoc,
      command.actorId,
      "Không thể cập nhật ghi chú cho môn học không thuộc sinh viên"
    );
    await this.deps.dichVuTepDinhKemGhiChu.kiemTraTrungDuongDan(
      command.tepDinhKem,
      command.actorId,
      command.maGhiChu
    );

    try {
      const ketQua = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const ghiChu = await this.deps.khoGhiChu.capNhat(
          {
            maGhiChu: command.maGhiChu,
            maMonHoc: command.maMonHoc,
            tieuDe: command.tieuDe,
            noiDung: command.noiDung
          },
          tx
        );

        if (!ghiChu) {
          await this.deps.dichVuGhiLogLoiGhiChu.ghiCanhBao({
            actorId: command.actorId,
            action: "NOTE_UPDATE_NOT_FOUND_DURING_TRANSACTION",
            tableName: "ghi_chu",
            recordId: command.maGhiChu,
            message: "Sinh vien cap nhat ghi chu that bai vi ban ghi khong con ton tai trong transaction",
            metadata: {
              maGhiChu: command.maGhiChu
            }
          });
          throw LoiUngDung.khongTimThay("Không tìm thấy ghi chú");
        }

        const soTepDaXoa = await this.deps.khoGhiChu.danhDauXoaTepDinhKemTheoDanhSach(
          command.maGhiChu,
          command.actorId,
          command.maTaiLieuCanXoa,
          tx
        );
        const tepMoi = await this.deps.dichVuTepDinhKemGhiChu.luuDanhSachTepDinhKem(
          command.tepDinhKem,
          command.maGhiChu,
          command.actorId,
          tx
        );
        const ghiChuSauCapNhat = await this.deps.khoGhiChu.timTheoMa(command.maGhiChu, tx);

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "NOTE_UPDATED",
            tableName: "ghi_chu",
            recordId: command.maGhiChu,
            message: "Sinh viên cập nhật ghi chú thành công",
            metadata: {
              maGhiChu: command.maGhiChu,
              maMonHocCu: ghiChuHienTai.maMonHoc,
              maMonHocMoi: command.maMonHoc,
              coNoiDung: Boolean(command.noiDung),
              soTepMoi: tepMoi.length,
              soTepDaXoa
            }
          },
          tx
        );

        return ghiChuSauCapNhat ?? { ...ghiChu, tepDinhKem: [] };
      });

      return {
        message: "Cập nhật ghi chú thành công",
        ghiChu: ketQua
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiGhiChu.ghi({
        actorId: command.actorId,
        action: "NOTE_UPDATE_FAILED",
        tableName: "ghi_chu",
        recordId: command.maGhiChu,
        message: "Lỗi cập nhật thông tin ghi chú vào database",
        error,
        metadata: {
          maGhiChu: command.maGhiChu,
          maMonHocCu: ghiChuHienTai.maMonHoc,
          maMonHocMoi: command.maMonHoc,
          soTepMoi: command.tepDinhKem.length,
          soTepCanXoa: command.maTaiLieuCanXoa.length
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể cập nhật ghi chú lúc này");
    }
  }
}
