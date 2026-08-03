import { z } from "zod";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { DichVuTemplatePromptAi } from "../../../../shared/ai/ai-prompt-template.service.js";
import type { DichVuGeminiAi } from "../../../../shared/ai/gemini-ai.provider.js";
import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import type { NoiDungTracNghiem } from "../../domain/flashcard.js";
import type { BoTrichXuatVanBanTaiLieu, TepTaiLieuFlashcard } from "../ports/document-text-extractor.js";
import type { KhoFlashcard } from "../ports/flashcard.repository.js";
import type { DichVuGhiLogLoiFlashcard } from "../services/flashcard-error-logger.service.js";
import { laUuidHopLe } from "../services/flashcard-validation.service.js";

const DUNG_LUONG_FILE_TOI_DA = 5 * 1024 * 1024;
const DO_DAI_VAN_BAN_TOI_THIEU = 30;
const DO_DAI_VAN_BAN_TOI_DA = 20000;

export type LenhTaoFlashcardTuFile = {
  actorId: string;
  maBo: string;
  file?: TepTaiLieuFlashcard | null;
  desiredCount?: number | null;
};

const PHAN_HOI_AI_SCHEMA = z.object({
  questions: z
    .array(
      z.object({
        cauHoi: z.string().min(1).max(500),
        cacLuaChon: z
          .array(
            z.object({
              id: z.string().trim().min(1).max(4),
              noiDung: z.string().min(1).max(500)
            })
          )
          .min(2)
          .max(6),
        dapAnDung: z.string().trim().min(1).max(4),
        giaiThich: z.string().max(1000).default("")
      })
    )
    .min(1)
    .max(100),
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

const chuanHoaCauTracNghiem = (
  cau: z.infer<typeof PHAN_HOI_AI_SCHEMA>["questions"][number]
): NoiDungTracNghiem | null => {
  const cacLuaChon = cau.cacLuaChon.map((luaChon) => ({
    id: luaChon.id.trim().toUpperCase(),
    noiDung: luaChon.noiDung.trim()
  }));
  const dapAnDung = cau.dapAnDung.trim().toUpperCase();
  const coDapAn = cacLuaChon.some((luaChon) => luaChon.id === dapAnDung);

  if (!coDapAn || cacLuaChon.length < 2) {
    return null;
  }

  return {
    cauHoi: cau.cauHoi.trim(),
    cacLuaChon,
    dapAnDung,
    giaiThich: cau.giaiThich.trim()
  };
};

export class XuLyTaoFlashcardTuFile {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoFlashcardTuFile) {
    if (!laUuidHopLe(command.maBo)) {
      await this.ghiCanhBao(command, "FLASHCARD_AI_IMPORT_DECK_ID_INVALID", "Tạo thẻ AI từ file thất bại - Mã bộ không hợp lệ");
      throw LoiUngDung.yeuCauSai("Mã bộ flashcard không hợp lệ");
    }

    if (!command.file) {
      await this.ghiCanhBao(command, "FLASHCARD_AI_IMPORT_FILE_MISSING", "Tạo thẻ AI từ file thất bại - Chưa tải file");
      throw LoiUngDung.yeuCauSai("Vui lòng tải lên file PDF, DOCX hoặc TXT");
    }

    if (command.file.buffer.byteLength > DUNG_LUONG_FILE_TOI_DA) {
      await this.ghiCanhBao(command, "FLASHCARD_AI_IMPORT_FILE_TOO_LARGE", "Tạo thẻ AI từ file thất bại - File vượt quá 5MB");
      throw LoiUngDung.yeuCauSai("File vượt quá dung lượng tối đa 5MB");
    }

    const bo = await this.deps.khoFlashcard.timBoCuaSinhVien(command.maBo, command.actorId);

    if (!bo) {
      await this.ghiCanhBao(command, "FLASHCARD_AI_IMPORT_FORBIDDEN", "Tạo thẻ AI từ file thất bại - Từ chối phân quyền");
      throw LoiUngDung.khongCoQuyen("Bạn không có quyền tạo thẻ trong bộ này");
    }

    const trichXuat = await this.deps.boTrichXuatVanBanTaiLieu.trichXuat(command.file);
    const sourceText = trichXuat.text.trim();

    if (sourceText.length < DO_DAI_VAN_BAN_TOI_THIEU) {
      await this.ghiCanhBao(command, "FLASHCARD_AI_IMPORT_TEXT_TOO_SHORT", "Tạo thẻ AI từ file thất bại - Nội dung quá ngắn");
      throw LoiUngDung.yeuCauSai("Nội dung tài liệu quá ngắn để tạo câu hỏi, vui lòng chọn file khác");
    }

    const vanBanRutGon = sourceText.slice(0, DO_DAI_VAN_BAN_TOI_DA);
    const desiredCount = Math.min(Math.max(command.desiredCount ?? 8, 3), 100);

    try {
      const prompt = await this.deps.dichVuPromptAi.lay("flashcard-quiz-generate.prompt.md");
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
      const cauHopLe = noiDung.questions
        .map(chuanHoaCauTracNghiem)
        .filter((cau): cau is NoiDungTracNghiem => cau !== null);

      if (cauHopLe.length === 0) {
        throw LoiUngDung.khongTheXuLy("AI chưa tạo được câu hỏi trắc nghiệm hợp lệ từ tài liệu này");
      }

      const createdCards = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const cards = await this.deps.khoFlashcard.taoNhieuThe(
          cauHopLe.map((cau) => ({
            maBo: command.maBo,
            loaiThe: "TRAC_NGHIEM" as const,
            matTruoc: cau.cauHoi,
            matSau: cau
          })),
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "FLASHCARD_AI_IMPORTED",
            tableName: "flashcard",
            recordId: command.maBo,
            message: "Sinh viên tạo flashcard trắc nghiệm bằng AI từ file tài liệu",
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
        message: `Đã tạo ${createdCards.length} thẻ trắc nghiệm bằng AI`,
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
        action: "FLASHCARD_AI_IMPORT_FAILED",
        tableName: "flashcard",
        recordId: command.maBo,
        message: "Không thể tạo flashcard trắc nghiệm bằng AI từ file",
        error,
        metadata: {
          maBo: command.maBo,
          tenFile: command.file?.tenFile ?? null,
          sourceType: trichXuat.sourceType,
          desiredCount
        }
      });

      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống AI bận, chưa thể tạo thẻ từ file lúc này");
    }
  }

  private async ghiCanhBao(command: LenhTaoFlashcardTuFile, action: string, message: string) {
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
