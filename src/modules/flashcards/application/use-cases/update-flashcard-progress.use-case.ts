import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { MucDoGhiNhoFlashcard } from "../../domain/flashcard.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";
import { laMucDoGhiNhoFlashcard, laUuidHopLe } from "../services/flashcard-validation.service.js";
import { tinhTienDoSm2 } from "../services/sm2.service.js";

export type LenhCapNhatTienDoFlashcard = {
  actorId: string;
  maFlashcard: string;
  mucDo?: string | null;
};

type PhuThuoc = {
  khoFlashcard: KhoFlashcard;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiFlashcard: DichVuGhiLogLoiFlashcard;
};

export class XuLyCapNhatTienDoFlashcard {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatTienDoFlashcard) {
    const mucDo = command.mucDo?.trim().toUpperCase() ?? "";
    const loi: string[] = [];

    if (!laUuidHopLe(command.maFlashcard)) {
      loi.push("Mã thẻ flashcard không hợp lệ");
    }

    if (!laMucDoGhiNhoFlashcard(mucDo)) {
      loi.push("Mức độ ghi nhớ không hợp lệ");
    }

    if (loi.length > 0) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_PROGRESS_VALIDATION_FAILED",
        tableName: "flashcard",
        recordId: command.maFlashcard,
        message: "Cập nhật tiến độ ôn tập thẻ thất bại do dữ liệu đầu vào không hợp lệ",
        metadata: { errors: loi, mucDo: command.mucDo }
      });
      throw LoiUngDung.yeuCauSai("Mức độ ghi nhớ không hợp lệ", loi);
    }

    const theHienTai = await this.deps.khoFlashcard.timTheCuaSinhVien(command.maFlashcard, command.actorId);

    if (!theHienTai) {
      await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
        actorId: command.actorId,
        action: "FLASHCARD_PROGRESS_FORBIDDEN",
        tableName: "flashcard",
        recordId: command.maFlashcard,
        message: "Cập nhật tiến độ ôn tập thẻ thất bại - Từ chối phân quyền",
        metadata: { maFlashcard: command.maFlashcard }
      });
      throw LoiUngDung.khongCoQuyen("Bạn không có quyền ôn tập thẻ này!");
    }

    const tienDo = tinhTienDoSm2(theHienTai, mucDo as MucDoGhiNhoFlashcard);

    try {
      const flashcard = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const the = await this.deps.khoFlashcard.capNhatTienDo(
          {
            maFlashcard: command.maFlashcard,
            soLanOn: tienDo.soLanOn,
            diemGhiNho: tienDo.diemGhiNho,
            thoiGianLanOnCuoi: tienDo.thoiGianLanOnCuoi,
            thoiGianLanOnTiepTheo: tienDo.thoiGianLanOnTiepTheo
          },
          tx
        );

        if (!the) {
          throw LoiUngDung.khongTimThay("Không tìm thấy thẻ flashcard cần cập nhật tiến độ");
        }

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "FLASHCARD_PROGRESS_UPDATED",
            tableName: "flashcard",
            recordId: the.maFlashcard,
            message: "Cập nhật tiến độ học thẻ thành công ",
            metadata: {
              maBo: the.maBo,
              maFlashcard: the.maFlashcard,
              mucDo,
              sm2Quality: tienDo.q,
              soLanOnCu: theHienTai.soLanOn,
              soLanOnMoi: tienDo.soLanOn,
              diemGhiNhoMoi: tienDo.diemGhiNho,
              khoangCachNgay: tienDo.khoangCachNgay,
              thoiGianOnTiepTheo: tienDo.thoiGianLanOnTiepTheo.toISOString(),
              ruleCode: "BR-CARD-01"
            }
          },
          tx
        );

        return the;
      });

      return {
        message: "Cập nhật tiến độ ôn tập thành công",
        flashcard,
        sm2: {
          mucDo,
          q: tienDo.q,
          khoangCachNgay: tienDo.khoangCachNgay,
          thoiGianOnTiepTheo: tienDo.thoiGianLanOnTiepTheo
        }
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiFlashcard.ghi({
        actorId: command.actorId,
        action: "FLASHCARD_PROGRESS_UPDATE_FAILED",
        tableName: "flashcard",
        recordId: command.maFlashcard,
        message: "Lỗi cập nhật tiến độ ôn tập thẻ flashcard",
        error,
        metadata: {
          maFlashcard: command.maFlashcard,
          mucDo
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống bận, không thể cập nhật tiến độ ôn tập lúc này");
    }
  }
}
