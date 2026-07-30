import { z } from "zod";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { DichVuTemplatePromptAi } from "../../../../shared/ai/ai-prompt-template.service.js";
import type { DichVuGeminiAi } from "../../../../shared/ai/gemini-ai.provider.js";
import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";

export type LenhTomTatTaiLieuBangAi = {
  actorId: string;
  title: string;
  content: string;
  objective?: string | null;
};

const PHAN_HOI_AI_SCHEMA = z.object({
  tomTatNgan: z.string().min(1),
  yChinh: z.array(z.string().min(1)).max(10).default([]),
  deXuatOnTap: z.array(z.string().min(1)).max(6).default([])
});

type PhuThuoc = {
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuPromptAi: DichVuTemplatePromptAi;
  dichVuGeminiAi: DichVuGeminiAi;
};

export class XuLyTomTatTaiLieuBangAi {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTomTatTaiLieuBangAi) {
    const title = command.title.trim();
    const content = command.content.trim();

    if (title.length < 3) {
      throw LoiUngDung.yeuCauSai("Tiêu đề tài liệu phải có ít nhất 3 ký tự");
    }

    if (content.length < 30) {
      throw LoiUngDung.yeuCauSai("Nội dung cần đủ chi tiết để AI tóm tắt (ít nhất 30 ký tự)");
    }

    if (content.length > 12000) {
      throw LoiUngDung.yeuCauSai("Nội dung quá dài, vui lòng rút gọn dưới 12000 ký tự để tránh vượt giới hạn token");
    }

    const prompt = await this.deps.dichVuPromptAi.lay("document-summary.prompt.md");
    const ketQuaAi = await this.deps.dichVuGeminiAi.sinhJson<unknown>({
      systemPrompt: prompt,
      userPayload: {
        title,
        content,
        objective: command.objective?.trim() || null
      },
      maxOutputTokens: 850
    });

    const noiDung = PHAN_HOI_AI_SCHEMA.parse(ketQuaAi.output);

    await this.deps.khoNhatKyHeThong.tao({
      actorId: command.actorId,
      level: "INFO",
      action: "DOCUMENT_AI_SUMMARY_GENERATED",
      tableName: "tai_lieu",
      message: "Sinh viên tạo tóm tắt tài liệu bằng AI",
      metadata: {
        title,
        usedFallbackKey: ketQuaAi.usedKeyIndex > 0,
        model: ketQuaAi.model
      }
    });

    return {
      message: "Đã tạo tóm tắt tài liệu bằng AI",
      title,
      ...noiDung
    };
  }
}
