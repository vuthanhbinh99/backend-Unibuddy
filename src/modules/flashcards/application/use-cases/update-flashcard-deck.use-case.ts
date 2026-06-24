import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";
import { kiemTraTenBoFlashcard, laUuidHopLe } from "../services/flashcard-validation.service.js";

export type LenhCapNhatBoFlashcard = {
  actorId: string;
  maBo: string;
  tenBo?: string | null;
};

type PhuThuoc = {
  khoFlashcard: KhoFlashcard;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiFlashcard: DichVuGhiLogLoiFlashcard;
};

export class XuLyCapNhatBoFlashcard {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatBoFlashcard) {
    const { tenBo, loi } = kiemTraTenBoFlashcard(command.tenBo);

    if (!laUuidHopLe(command.maBo)) {
      loi.push("Mã bộ flashcard không hợp lệ");
    }

    if (loi.length > 0) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_DECK_UPDATE_VALIDATION_FAILED",
        tableName: "bo_flashcard",
        recordId: command.maBo,
        message: "Thao tác sửa bộ flashcard thất bại do dữ liệu lỗi",
        metadata: { errors: loi }
      });
      throw LoiUngDung.yeuCauSai("Tên bộ flashcard không được để trống!", loi);
    }

    const boHienTai = await this.deps.khoFlashcard.timBoCuaSinhVien(command.maBo, command.actorId);

    if (!boHienTai) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_DECK_UPDATE_FORBIDDEN",
        tableName: "bo_flashcard",
        recordId: command.maBo,
        message: "Thao tác sửa bộ flashcard thất bại do sai quyền sở hữu",
        metadata: { maBo: command.maBo }
      });
      throw LoiUngDung.khongCoQuyen("Bạn không có quyền chỉnh sửa bộ flashcard này!");
    }

    try {
      const boFlashcard = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const bo = await this.deps.khoFlashcard.capNhatBo({ maBo: command.maBo, tenBo }, tx);

        if (!bo) {
          throw LoiUngDung.khongTimThay("Không tìm thấy bộ flashcard cần cập nhật");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "FLASHCARD_DECK_UPDATED",
            tableName: "bo_flashcard",
            recordId: bo.maBo,
            message: "Chỉnh sửa tên bộ flashcard thành công",
            metadata: {
              maBo: bo.maBo,
              tenBoCu: boHienTai.tenBo,
              tenBoMoi: tenBo
            }
          },
          tx
        );

        return bo;
      });

      return {
        message: "Cập nhật tên bộ thành công",
        boFlashcard
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiFlashcard.ghi({
        actorId: command.actorId,
        action: "FLASHCARD_DECK_UPDATE_FAILED",
        tableName: "bo_flashcard",
        recordId: command.maBo,
        message: "Lỗi cập nhật bộ flashcard",
        error,
        metadata: { tenBo }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể cập nhật bộ flashcard lúc này");
    }
  }
}
