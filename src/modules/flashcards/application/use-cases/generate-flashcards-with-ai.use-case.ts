import { z } from "zod";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DichVuTemplatePromptAi } from "../../../../shared/ai/ai-prompt-template.service.js";
import type { DichVuGeminiAi } from "../../../../shared/ai/gemini-ai.provider.js";
import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";
import { laUuidHopLe } from "../services/flashcard-validation.service.js";

export type LenhTaoFlashcardBangAi = {
  actorId: string;
  maBo: string;
  sourceText: string;
  desiredCount?: number | null;
};

const PHAN_HOI_AI_SCHEMA = z.object({
  cards: z
    .array(
      z.object({
        front: z.string().min(1).max(300),
        back: z.string().min(1).max(1000)
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
  dichVuPromptAi: DichVuTemplatePromptAi;
  dichVuGeminiAi: DichVuGeminiAi;
};

export class XuLyTaoFlashcardBangAi {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoFlashcardBangAi) {
    if (!laUuidHopLe(command.maBo)) {
      throw LoiUngDung.yeuCauSai("Mã bộ flashcard không hợp lệ");
    }

    const sourceText = command.sourceText.trim();

    if (sourceText.length < 30) {
      throw LoiUngDung.yeuCauSai("Nội dung quá ngắn để tạo flashcard, vui lòng nhập ít nhất 30 ký tự");
    }

    if (sourceText.length > 12000) {
      throw LoiUngDung.yeuCauSai("Nội dung quá dài, vui lòng rút gọn dưới 12000 ký tự");
    }

    const desiredCount = Math.min(Math.max(command.desiredCount ?? 8, 3), 30);
    const bo = await this.deps.khoFlashcard.timBoCuaSinhVien(command.maBo, command.actorId);

    if (!bo) {
      throw LoiUngDung.khongCoQuyen("Bạn không có quyền tạo thẻ trong bộ này");
    }

    try {
      const prompt = await this.deps.dichVuPromptAi.lay("flashcard-generate.prompt.md");
      const ketQuaAi = await this.deps.dichVuGeminiAi.sinhJson<unknown>({
        systemPrompt: prompt,
        userPayload: {
          deckTitle: bo.tenBo,
          desiredCount,
          sourceText
        },
        maxOutputTokens: 1100
      });

      const noiDung = PHAN_HOI_AI_SCHEMA.parse(ketQuaAi.output);

      const createdCards = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const cards = await this.deps.khoFlashcard.taoNhieuThe(
          noiDung.cards.map((item) => ({
            maBo: command.maBo,
            matTruoc: item.front.trim(),
            matSau: item.back.trim()
          })),
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "FLASHCARD_AI_GENERATED",
            tableName: "flashcard",
            recordId: command.maBo,
            message: "Sinh viên tạo flashcard bằng AI",
            metadata: {
              maBo: command.maBo,
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
        message: `Đã tạo ${createdCards.length} flashcard bằng AI`,
        notes: noiDung.notes,
        items: createdCards
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiFlashcard.ghi({
        actorId: command.actorId,
        action: "FLASHCARD_AI_GENERATE_FAILED",
        tableName: "flashcard",
        recordId: command.maBo,
        message: "Không thể tạo flashcard bằng AI",
        error,
        metadata: {
          maBo: command.maBo,
          desiredCount
        }
      });

      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống AI bận, chưa thể tạo flashcard lúc này");
    }
  }
}
