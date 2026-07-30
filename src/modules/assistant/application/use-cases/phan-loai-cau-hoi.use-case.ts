import { z } from "zod";
import type { DichVuTemplatePromptAi } from "../../../../shared/ai/ai-prompt-template.service.js";
import type { DichVuGeminiAi } from "../../../../shared/ai/gemini-ai.provider.js";
import { CAC_MODULE, type KetQuaPhanLoai, type TinNhan } from "../../domain/assistant.js";

type PhuThuoc = {
  dichVuPromptAi: DichVuTemplatePromptAi;
  dichVuGeminiAi: DichVuGeminiAi;
};

// Ép module về đúng tập hợp, độ tin cậy về [0,1], default an toàn nếu thiếu field.
const PHAN_LOAI_SCHEMA = z.object({
  trongPhamVi: z.boolean().default(false),
  module: z.enum(CAC_MODULE).catch("khac"),
  doTinCay: z.coerce.number().min(0).max(1).catch(0),
  lyDoTuChoi: z.string().trim().min(1).nullable().catch(null)
});

export type LenhPhanLoaiCauHoi = {
  message: string;
  lichSu: TinNhan[];
};

export class XuLyPhanLoaiCauHoi {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhPhanLoaiCauHoi): Promise<KetQuaPhanLoai> {
    const prompt = await this.deps.dichVuPromptAi.lay("assistant-router.prompt.md");

    const ketQuaAi = await this.deps.dichVuGeminiAi.sinhJson<unknown>({
      systemPrompt: prompt,
      userPayload: {
        cauHoi: command.message,
        // Chỉ đưa vài lượt gần nhất để router có ngữ cảnh mà không tốn token.
        lichSuGanNhat: command.lichSu.slice(-4).map((tin) => ({
          vaiTro: tin.vaiTro,
          noiDung: tin.noiDung
        }))
      },
      maxOutputTokens: 150
    });

    return PHAN_LOAI_SCHEMA.parse(ketQuaAi.output);
  }
}
