import { z } from "zod";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { DichVuTemplatePromptAi } from "../../../../shared/ai/ai-prompt-template.service.js";
import type { DichVuGeminiAi } from "../../../../shared/ai/gemini-ai.provider.js";
import {
  boSungMappingNgayKetThucTuCotGop,
  goiYMappingCotImportThoiKhoaBieu
} from "../services/schedule-import-mapper.service.js";
import type { DichVuGhiLogLoiThoiKhoaBieu } from "../services/schedule-error-logger.service.js";

export type LenhGoiYMappingImportLichHocBangAi = {
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
      thu: z.string().trim().min(1).optional(),
      tietBatDau: z.string().trim().min(1).optional(),
      soTiet: z.string().trim().min(1).optional(),
      soTinChi: z.string().trim().min(1).optional(),
      phongHoc: z.string().trim().min(1).optional(),
      ngayBatDau: z.string().trim().min(1).optional(),
      ngayKetThuc: z.string().trim().min(1).optional()
    })
    .default({}),
  confidence: z.number().min(0).max(1).default(0),
  notes: z.array(z.string().min(1)).max(8).default([])
});

type PhuThuoc = {
  dichVuPromptAi: DichVuTemplatePromptAi;
  dichVuGeminiAi: DichVuGeminiAi;
  dichVuGhiLogLoiThoiKhoaBieu: DichVuGhiLogLoiThoiKhoaBieu;
};

const taoKetQuaFallback = (headers: string[]) => ({
  message: "Đã tự nhận diện mapping cột import thời khóa biểu",
  mapping: goiYMappingCotImportThoiKhoaBieu(headers),
  notes: ["AI tạm thời không sẵn sàng, hệ thống tiếp tục bằng nhận diện cột tự động từ tên tiêu đề."]
});

export class XuLyGoiYMappingImportLichHocBangAi {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhGoiYMappingImportLichHocBangAi) {
    const headers = command.headers.map((item) => item.trim()).filter(Boolean);

    if (headers.length < 2) {
      throw LoiUngDung.yeuCauSai("Cần ít nhất 2 cột tiêu đề để AI gợi ý mapping");
    }

    if (command.sampleRows.length === 0) {
      throw LoiUngDung.yeuCauSai("Cần gửi dữ liệu mẫu để AI phân tích mapping");
    }

    try {
      const prompt = await this.deps.dichVuPromptAi.lay("schedule-import-mapping.prompt.md");
      const ketQuaAi = await this.deps.dichVuGeminiAi.sinhJson<unknown>({
        systemPrompt: prompt,
        userPayload: {
          headers: headers.slice(0, 40),
          sampleRows: command.sampleRows.slice(0, 12)
        },
        maxOutputTokens: 700
      });

      const noiDung = PHAN_HOI_AI_SCHEMA.parse(ketQuaAi.output);
      const mapping = boSungMappingNgayKetThucTuCotGop(noiDung.mapping, {
        rows: command.sampleRows
      });

      return {
        message: "Đã gợi ý mapping cột import thời khóa biểu",
        ...noiDung,
        mapping
      };
    } catch (error) {
      await this.deps.dichVuGhiLogLoiThoiKhoaBieu.ghiCanhBao({
        actorId: command.actorId,
        action: "SCHEDULE_IMPORT_MAPPING_AI_FALLBACK",
        tableName: "lich_hoc",
        message: "AI gợi ý mapping import lịch học không sẵn sàng, chuyển sang nhận diện cột tự động",
        metadata: {
          soCot: headers.length,
          soDongMau: command.sampleRows.length,
          fallbackMode: "HEADER_HEURISTIC",
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      });

      return taoKetQuaFallback(headers);
    }
  }
}
