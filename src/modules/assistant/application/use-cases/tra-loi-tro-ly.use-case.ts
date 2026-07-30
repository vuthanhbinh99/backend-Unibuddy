import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { DichVuTemplatePromptAi } from "../../../../shared/ai/ai-prompt-template.service.js";
import type { DichVuGeminiAi, LuotChat } from "../../../../shared/ai/gemini-ai.provider.js";
import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import {
  CAPABILITIES,
  NGUONG_DO_TIN_CAY,
  moTaCapabilitiesChoNguoiDung,
  type LoaiModule,
  type TinNhan
} from "../../domain/assistant.js";
import type { DichVuPrefilterTroLy } from "../services/assistant-prefilter.service.js";
import type { DichVuGroundingTroLy } from "../services/assistant-grounding.service.js";
import type { DichVuGhiLogLoiTroLy } from "../services/assistant-error-logger.service.js";
import type { XuLyPhanLoaiCauHoi } from "./phan-loai-cau-hoi.use-case.js";

type PhuThuoc = {
  dichVuPrefilterTroLy: DichVuPrefilterTroLy;
  xuLyPhanLoaiCauHoi: XuLyPhanLoaiCauHoi;
  dichVuGroundingTroLy: DichVuGroundingTroLy;
  dichVuPromptAi: DichVuTemplatePromptAi;
  dichVuGeminiAi: DichVuGeminiAi;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuGhiLogLoiTroLy: DichVuGhiLogLoiTroLy;
};

export type LenhTraLoiTroLy = {
  actorId: string;
  message: string;
  lichSu: TinNhan[];
};

export type KetQuaTraLoiTroLy = {
  message: string;
  module: LoaiModule;
  doTinCay: number;
  tuChoi: boolean;
};

const goiYTheoModule = (module: LoaiModule) => {
  const capability = CAPABILITIES.find((item) => item.module === module && item.module !== "khac");

  if (capability) {
    return `Bạn có muốn mình hỗ trợ về "${capability.ten}" không? ${capability.moTa}.`;
  }

  return `Mình chỉ hỗ trợ các chủ đề học tập sau:\n${moTaCapabilitiesChoNguoiDung()}`;
};

export class XuLyTraLoiTroLy {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTraLoiTroLy): Promise<KetQuaTraLoiTroLy> {
    // Lớp 1 — Pre-filter: chặn bằng code, không gọi AI.
    const ketQuaPrefilter = this.deps.dichVuPrefilterTroLy.kiemTra(command.message);

    if (ketQuaPrefilter.chan) {
      await this.deps.dichVuGhiLogLoiTroLy.ghiCanhBao({
        actorId: command.actorId,
        action: "AI_CHAT_PREFILTER_BLOCKED",
        message: "Câu hỏi bị chặn ở lớp pre-filter",
        metadata: { lyDo: ketQuaPrefilter.lyDo }
      });

      return {
        message: ketQuaPrefilter.lyDo ?? "Mình chỉ hỗ trợ các câu hỏi liên quan đến học tập nhé.",
        module: "khac",
        doTinCay: 0,
        tuChoi: true
      };
    }

    try {
      // Lớp 2 — Router: phân loại câu hỏi.
      const phanLoai = await this.deps.xuLyPhanLoaiCauHoi.thucThi({
        message: command.message,
        lichSu: command.lichSu
      });

      // Ngoài phạm vi hoặc độ tin cậy thấp → từ chối sớm, KHÔNG gọi tầng trả lời (tiết kiệm token).
      if (!phanLoai.trongPhamVi || phanLoai.doTinCay < NGUONG_DO_TIN_CAY) {
        await this.deps.khoNhatKyHeThong.tao({
          actorId: command.actorId,
          level: "INFO",
          action: "AI_CHAT_REFUSED",
          message: "Trợ lý từ chối câu hỏi ngoài phạm vi",
          metadata: {
            module: phanLoai.module,
            doTinCay: phanLoai.doTinCay,
            lyDoTuChoi: phanLoai.lyDoTuChoi
          }
        });

        const lyDo = phanLoai.lyDoTuChoi?.trim() || "Câu hỏi này nằm ngoài phạm vi hỗ trợ học tập của mình.";

        return {
          message: `${lyDo}\n\n${goiYTheoModule(phanLoai.module)}`,
          module: phanLoai.module,
          doTinCay: phanLoai.doTinCay,
          tuChoi: true
        };
      }

      // Lớp 3 — RAG nhẹ + trả lời phòng thủ.
      const duLieuThat = await this.deps.dichVuGroundingTroLy.lay(phanLoai.module, command.actorId);
      const answerPrompt = await this.deps.dichVuPromptAi.lay("assistant-answer.prompt.md");

      const lichSuChat: LuotChat[] = [
        ...command.lichSu.slice(-10).map((tin) => ({
          role: tin.vaiTro === "assistant" ? ("model" as const) : ("user" as const),
          text: tin.noiDung
        })),
        {
          role: "user" as const,
          text: JSON.stringify({
            cauHoi: command.message,
            module: phanLoai.module,
            duLieu: duLieuThat
          })
        }
      ];

      const ketQuaAi = await this.deps.dichVuGeminiAi.sinhChat({
        systemPrompt: answerPrompt,
        lichSu: lichSuChat,
        maxOutputTokens: 800,
        temperature: 0.4
      });

      if (!ketQuaAi.text) {
        throw LoiUngDung.khongTheXuLy("Dịch vụ AI chưa trả về nội dung hợp lệ");
      }

      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "INFO",
        action: "AI_CHAT_ANSWERED",
        message: "Trợ lý trả lời câu hỏi học tập",
        metadata: {
          module: phanLoai.module,
          doTinCay: phanLoai.doTinCay,
          usedFallbackKey: ketQuaAi.usedKeyIndex > 0,
          model: ketQuaAi.model
        }
      });

      return {
        message: ketQuaAi.text,
        module: phanLoai.module,
        doTinCay: phanLoai.doTinCay,
        tuChoi: false
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiTroLy.ghi({
        actorId: command.actorId,
        action: "AI_CHAT_FAILED",
        message: "Không thể xử lý câu hỏi trợ lý bằng AI",
        error
      });

      throw LoiUngDung.khongTheXuLy("Hệ thống AI đang bận, vui lòng thử lại sau");
    }
  }
}
