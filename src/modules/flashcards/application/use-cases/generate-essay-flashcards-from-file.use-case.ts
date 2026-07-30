import { z } from "zod";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DichVuTemplatePromptAi } from "../../../../shared/ai/ai-prompt-template.service.js";
import type { DichVuGeminiAi } from "../../../../shared/ai/gemini-ai.provider.js";
import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import type { BoTrichXuatVanBanTaiLieu, TepTaiLieuFlashcard } from "../ports/document-text-extractor.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";
import { DO_DAI_TOI_DA_NOI_DUNG_THE_FLASHCARD, laUuidHopLe } from "../services/flashcard-validation.service.js";

const DUNG_LUONG_FILE_TOI_DA = 5 * 1024 * 1024;
const DO_DAI_VAN_BAN_TOI_THIEU = 30;
const DO_DAI_VAN_BAN_TOI_DA = 20000;

export type LenhTaoFlashcardTuLuanTuFile = {
  actorId: string;
  maBo: string;
  file?: TepTaiLieuFlashcard | null;
  desiredCount?: number | null;
};

const PHAN_HOI_AI_SCHEMA = z.object({
  cards: z
    .array(
      z.object({
        front: z.string().min(1).max(500),
        back: z.string().min(1).max(DO_DAI_TOI_DA_NOI_DUNG_THE_FLASHCARD)
      })
    )
    .min(1)
    .max(30),
  notes: z.array(z.string().min(1)).max(6).default([])
});

type PhuThuoc = {
  khoFlashcard: KhoFlashcard;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiFlashcard: DichVuGhiLogLoiFlashcard;
  boTrichXuatVanBanTaiLieu: BoTrichXuatVanBanTaiLieu;
  dichVuPromptAi: DichVuTemplatePromptAi;
  dichVuGeminiAi: DichVuGeminiAi;
};

const chuanHoaTheTuLuan = (card: z.infer<typeof PHAN_HOI_AI_SCHEMA>["cards"][number]) => {
  const front = card.front.trim();
  const back = card.back.trim();

  if (!front || !back) {
    return null;
  }

  return { front, back };
};

export class XuLyTaoFlashcardTuLuanTuFile {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoFlashcardTuLuanTuFile) {
    if (!laUuidHopLe(command.maBo)) {
      await this.ghiCanhBao(command, "FLASHCARD_AI_ESSAY_IMPORT_DECK_ID_INVALID", "Tạo thẻ tự luận AI từ file thất bại - Mã bộ không hợp lệ");
      throw LoiUngDung.yeuCauSai("Mã bộ flashcard không hợp lệ");
    }

    if (!command.file) {
      await this.ghiCanhBao(command, "FLASHCARD_AI_ESSAY_IMPORT_FILE_MISSING", "Tạo thẻ tự luận AI từ file thất bại - Chưa tải file");
      throw LoiUngDung.yeuCauSai("Vui lòng tải lên file PDF, DOCX hoặc TXT");
    }

    if (command.file.buffer.byteLength > DUNG_LUONG_FILE_TOI_DA) {
      await this.ghiCanhBao(command, "FLASHCARD_AI_ESSAY_IMPORT_FILE_TOO_LARGE", "Tạo thẻ tự luận AI từ file thất bại - File vượt quá 5MB");
      throw LoiUngDung.yeuCauSai("File vượt quá dung lượng tối đa 5MB");
    }

    const bo = await this.deps.khoFlashcard.timBoCuaSinhVien(command.maBo, command.actorId);

    if (!bo) {
      await this.ghiCanhBao(command, "FLASHCARD_AI_ESSAY_IMPORT_FORBIDDEN", "Tạo thẻ tự luận AI từ file thất bại - Từ chối phân quyền");
      throw LoiUngDung.khongCoQuyen("Bạn không có quyền tạo thẻ trong bộ này");
    }

    const trichXuat = await this.deps.boTrichXuatVanBanTaiLieu.trichXuat(command.file);
    const sourceText = trichXuat.text.trim();

    if (sourceText.length < DO_DAI_VAN_BAN_TOI_THIEU) {
      await this.ghiCanhBao(command, "FLASHCARD_AI_ESSAY_IMPORT_TEXT_TOO_SHORT", "Tạo thẻ tự luận AI từ file thất bại - Nội dung quá ngắn");
      throw LoiUngDung.yeuCauSai("Nội dung tài liệu quá ngắn để tạo thẻ tự luận, vui lòng chọn file khác");
    }

    const vanBanRutGon = sourceText.slice(0, DO_DAI_VAN_BAN_TOI_DA);
    const desiredCount = Math.min(Math.max(command.desiredCount ?? 8, 3), 30);

    try {
      const prompt = await this.deps.dichVuPromptAi.lay("flashcard-tu-luan-generate.prompt.md");
      const ketQuaAi = await this.deps.dichVuGeminiAi.sinhJson<unknown>({
        systemPrompt: prompt,
        userPayload: {
          deckTitle: bo.tenBo,
          desiredCount,
          sourceText: vanBanRutGon
        },
        maxOutputTokens: 2400
      });

      const noiDung = PHAN_HOI_AI_SCHEMA.parse(ketQuaAi.output);
      const theHopLe = noiDung.cards
        .map(chuanHoaTheTuLuan)
        .filter((card): card is { front: string; back: string } => card !== null);

      if (theHopLe.length === 0) {
        throw LoiUngDung.khongTheXuLy("AI chưa tạo được thẻ tự luận hợp lệ từ tài liệu này");
      }

      const createdCards = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const cards = await this.deps.khoFlashcard.taoNhieuThe(
          theHopLe.map((card) => ({
            maBo: command.maBo,
            loaiThe: "TU_LUAN" as const,
            matTruoc: card.front,
            matSau: card.back
          })),
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "FLASHCARD_AI_ESSAY_IMPORTED",
            tableName: "flashcard",
            recordId: command.maBo,
            message: "Sinh viên tạo flashcard tự luận bằng AI từ file tài liệu",
            metadata: {
              maBo: command.maBo,
              tenBo: bo.tenBo,
              sourceType: trichXuat.sourceType,
              tenFile: command.file?.tenFile ?? null,
              generatedCount: cards.length,
              desiredCount,
              usedFallbackKey: ketQuaAi.usedKeyIndex > 0,
              model: ketQuaAi.model
            }
          },
          tx
        );

        return cards;
      });

      return {
        message: `Đã tạo ${createdCards.length} thẻ tự luận bằng AI`,
        notes: noiDung.notes,
        importedCount: createdCards.length,
        items: createdCards
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiFlashcard.ghi({
        actorId: command.actorId,
        action: "FLASHCARD_AI_ESSAY_IMPORT_FAILED",
        tableName: "flashcard",
        recordId: command.maBo,
        message: "Không thể tạo flashcard tự luận bằng AI từ file",
        error,
        metadata: {
          maBo: command.maBo,
          tenFile: command.file?.tenFile ?? null,
          sourceType: trichXuat.sourceType,
          desiredCount
        }
      });

      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống AI bận, chưa thể tạo thẻ tự luận từ file lúc này");
    }
  }

  private async ghiCanhBao(command: LenhTaoFlashcardTuLuanTuFile, action: string, message: string) {
    await this.deps.dichVuGhiLogLoiFlashcard.ghiCanhBao({
      actorId: command.actorId,
      action,
      tableName: "flashcard",
      recordId: command.maBo,
      message,
      metadata: {
        maBo: command.maBo,
        tenFile: command.file?.tenFile ?? null
      }
    });
  }
}
