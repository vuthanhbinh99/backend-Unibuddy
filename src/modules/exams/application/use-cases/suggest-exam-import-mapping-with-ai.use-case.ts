import { z } from "zod";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { DichVuTemplatePromptAi } from "../../../../shared/ai/ai-prompt-template.service.js";
import type { DichVuGeminiAi } from "../../../../shared/ai/gemini-ai.provider.js";
import {
  boSungMappingCotImportLichThi,
  goiYMappingCotImportLichThi
} from "../services/exam-import-mapper.service.js";

export type LenhGoiYMappingImportLichThiBangAi = {
  actorId: string;
  headers: string[];
  sampleRows: Array<Record<string, unknown>>;
};

const PHAN_HOI_AI_SCHEMA = z.object({
  mapping: z
    .object({
      maMonHoc: z.string().trim().min(1).optional(),
      maMon: z.string().trim().min(1).optional(),
      tenMon: z.string().trim().min(1).optional(),
      thoiGianThi: z.string().trim().min(1).optional(),
      ngayThi: z.string().trim().min(1).optional(),
      gioBatDau: z.string().trim().min(1).optional(),
      phongThi: z.string().trim().min(1).optional(),
      diaDiemThi: z.string().trim().min(1).optional()
    })
    .default({}),
  confidence: z.number().min(0).max(1).default(0),
  notes: z.array(z.string().min(1)).max(8).default([])
});

type PhuThuoc = {
  dichVuPromptAi: DichVuTemplatePromptAi;
  dichVuGeminiAi: DichVuGeminiAi;
};

const taoKetQuaFallback = (headers: string[]) => ({
  message: "Đã tự nhận diện mapping cột import lịch thi",
  mapping: goiYMappingCotImportLichThi(headers),
  notes: ["AI tạm thời không sẵn sàng, hệ thống tiếp tục bằng nhận diện cột tự động từ tên tiêu đề."]
});

export class XuLyGoiYMappingImportLichThiBangAi {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhGoiYMappingImportLichThiBangAi) {
    const headers = command.headers.map((item) => item.trim()).filter(Boolean);

    if (headers.length < 2) {
      throw LoiUngDung.yeuCauSai("Cần ít nhất 2 cột tiêu đề để AI gợi ý mapping");
    }

    if (command.sampleRows.length === 0) {
      throw LoiUngDung.yeuCauSai("Cần gửi dữ liệu mẫu để AI phân tích mapping");
    }

    try {
      const prompt = await this.deps.dichVuPromptAi.lay("exam-import-mapping.prompt.md");
      const ketQuaAi = await this.deps.dichVuGeminiAi.sinhJson<unknown>({
        systemPrompt: prompt,
        userPayload: {
          headers: headers.slice(0, 40),
          sampleRows: command.sampleRows.slice(0, 12)
        },
        maxOutputTokens: 700
      });
      const noiDung = PHAN_HOI_AI_SCHEMA.parse(ketQuaAi.output);
      const mapping = boSungMappingCotImportLichThi(noiDung.mapping, headers);

      return {
        message: "Đã gợi ý mapping cột import lịch thi",
        ...noiDung,
        mapping
      };
    } catch {
      return taoKetQuaFallback(headers);
    }
  }
}
