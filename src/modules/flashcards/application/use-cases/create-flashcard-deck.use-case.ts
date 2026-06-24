import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";
import { kiemTraTenBoFlashcard, laUuidHopLe } from "../services/flashcard-validation.service.js";

export type LenhTaoBoFlashcard = {
  actorId: string;
  tenBo?: string | null;
  maMonHoc?: string | null;
};

type PhuThuoc = {
  khoFlashcard: KhoFlashcard;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiFlashcard: DichVuGhiLogLoiFlashcard;
};

export class XuLyTaoBoFlashcard {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoBoFlashcard) {
    const { tenBo, loi } = kiemTraTenBoFlashcard(command.tenBo);
    const maMonHoc = command.maMonHoc?.trim() || null;

    if (maMonHoc && !laUuidHopLe(maMonHoc)) {
      loi.push("Mã môn học không hợp lệ");
    }

    if (loi.length > 0) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_DECK_CREATE_VALIDATION_FAILED",
        tableName: "bo_flashcard",
        message: "Thao tác tạo bộ flashcard thất bại do dữ liệu lỗi",
        metadata: { errors: loi, maMonHoc }
      });
      throw LoiUngDung.yeuCauSai("Tên bộ flashcard không được để trống!", loi);
    }

    const monHoc = maMonHoc ? await this.deps.khoFlashcard.timMonHocCuaSinhVien(maMonHoc, command.actorId) : null;

    if (maMonHoc && !monHoc) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_DECK_CREATE_COURSE_FORBIDDEN",
        tableName: "bo_flashcard",
        message: "Sinh viên tạo bộ flashcard thất bại do môn học không thuộc sinh viên",
        metadata: { maMonHoc }
      });
      throw LoiUngDung.khongCoQuyen("Không thể tạo bộ flashcard cho môn học không thuộc sinh viên");
    }

    try {
      const boFlashcard = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const bo = await this.deps.khoFlashcard.taoBo(
          {
            maNguoiDung: command.actorId,
            maMonHoc,
            tenBo
          },
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "FLASHCARD_DECK_CREATED",
            tableName: "bo_flashcard",
            recordId: bo.maBo,
            message: "Tạo bộ flashcard thành công",
            metadata: {
              maBo: bo.maBo,
              maMonHoc,
              tenBo,
              maMon: monHoc?.maMon ?? null,
              tenMon: monHoc?.tenMon ?? null
            }
          },
          tx
        );

        return bo;
      });

      return {
        message: "Tạo bộ Flashcard thành công",
        boFlashcard
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiFlashcard.ghi({
        actorId: command.actorId,
        action: "FLASHCARD_DECK_CREATE_FAILED",
        tableName: "bo_flashcard",
        message: "Lỗi lưu thông tin bộ flashcard vào database",
        error,
        metadata: { maMonHoc, tenBo }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể tạo bộ flashcard lúc này");
    }
  }
}
