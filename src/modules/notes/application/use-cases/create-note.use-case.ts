import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DichVuQuyenGhiChu } from "../services/note-access.service.js";
import type { DichVuTepDinhKemGhiChu } from "../services/note-attachment.service.js";
import type { DichVuGhiLogLoiGhiChu } from "../services/note-error-logger.service.js";
import type { KhoGhiChu } from "../ports/note.repository.js";
import type { LenhTaoGhiChu } from "./note-use-case.types.js";

type PhuThuoc = {
  khoGhiChu: KhoGhiChu;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuQuyenGhiChu: DichVuQuyenGhiChu;
  dichVuTepDinhKemGhiChu: DichVuTepDinhKemGhiChu;
  dichVuGhiLogLoiGhiChu: DichVuGhiLogLoiGhiChu;
};

export class XuLyTaoGhiChu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoGhiChu) {
    await this.deps.dichVuQuyenGhiChu.kiemTraMonHocNeuCo(
      command.maMonHoc,
      command.actorId,
      "Không thể tạo ghi chú cho môn học này vì không thuộc sinh viên trong môn học"
    );
    await this.deps.dichVuTepDinhKemGhiChu.kiemTraTrungDuongDan(command.tepDinhKem, command.actorId);

    try {
      const ketQua = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const ghiChu = await this.deps.khoGhiChu.tao(
          {
            maNguoiDung: command.actorId,
            maMonHoc: command.maMonHoc,
            tieuDe: command.tieuDe,
            noiDung: command.noiDung
          },
          tx
        );

        const tepDinhKem = await this.deps.dichVuTepDinhKemGhiChu.luuDanhSachTepDinhKem(
          command.tepDinhKem,
          ghiChu.maGhiChu,
          command.actorId,
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "NOTE_CREATED",
            tableName: "ghi_chu",
            recordId: ghiChu.maGhiChu,
            message: "Sinh viên thêm ghi chú thành công",
            metadata: {
              maGhiChu: ghiChu.maGhiChu,
              maMonHoc: command.maMonHoc,
              coNoiDung: Boolean(command.noiDung),
              soTepDinhKem: tepDinhKem.length
            }
          },
          tx
        );

        return {
          ...ghiChu,
          tepDinhKem
        };
      });

      return {
        message: "Thêm ghi chú thành công",
        ghiChu: ketQua
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiGhiChu.ghi({
        actorId: command.actorId,
        action: "NOTE_CREATE_FAILED",
        tableName: "ghi_chu",
        message: "Lỗi lưu thông tin ghi chú vào database",
        error,
        metadata: {
          maMonHoc: command.maMonHoc,
          coNoiDung: Boolean(command.noiDung),
          soTepDinhKem: command.tepDinhKem.length
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể thêm ghi chú lúc này");
    }
  }
}
