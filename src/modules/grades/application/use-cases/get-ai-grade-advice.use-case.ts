import { z } from "zod";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { DichVuTemplatePromptAi } from "../../../../shared/ai/ai-prompt-template.service.js";
import type { DichVuGeminiAi } from "../../../../shared/ai/gemini-ai.provider.js";
import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoDiemSo } from "../ports/grade.repository.js";
import type { DichVuGhiLogLoiDiemSo } from "../services/grade-error-logger.service.js";

export type LenhLayGoiYHocTapBangAi = {
  actorId: string;
  maHocKy: string;
  targetGpa?: number | null;
  focus?: string | null;
};

const PHAN_HOI_AI_SCHEMA = z.object({
  tongQuan: z.string().min(1),
  uuTien: z.array(z.string().min(1)).max(6).default([]),
  keHoach7Ngay: z.array(z.string().min(1)).max(7).default([]),
  canhBao: z.array(z.string().min(1)).max(5).default([])
});

type PhuThuoc = {
  khoDiemSo: KhoDiemSo;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuGhiLogLoiDiemSo: DichVuGhiLogLoiDiemSo;
  dichVuPromptAi: DichVuTemplatePromptAi;
  dichVuGeminiAi: DichVuGeminiAi;
};

export class XuLyLayGoiYHocTapBangAi {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhLayGoiYHocTapBangAi) {
    const hocKy = await this.deps.khoDiemSo.timHocKyCuaSinhVien(command.maHocKy, command.actorId);

    if (!hocKy) {
      throw LoiUngDung.khongCoQuyen("Học kỳ không thuộc tài khoản sinh viên");
    }

    const monHoc = await this.deps.khoDiemSo.lietKeMonHocBangDiem({
      actorId: command.actorId,
      maHocKy: command.maHocKy
    });

    if (monHoc.length === 0) {
      throw LoiUngDung.khongTheXuLy("Học kỳ này chưa có môn học để phân tích");
    }

    try {
      const thanhPhanTheoMon = await Promise.all(
        monHoc.map(async (item) => ({
          maMonHoc: item.maMonHoc,
          tenMon: item.tenMon,
          maMon: item.maMon,
          soTinChi: item.soTinChi,
          components: (await this.deps.khoDiemSo.lietKeThanhPhanTheoMon(item.maMonHoc)).map((component) => ({
            tenThanhPhan: component.tenThanhPhan,
            trongSo: component.trongSo,
            diem: component.diem
          }))
        }))
      );

      const prompt = await this.deps.dichVuPromptAi.lay("grade-study-advice.prompt.md");
      const ketQuaAi = await this.deps.dichVuGeminiAi.sinhJson<unknown>({
        systemPrompt: prompt,
        userPayload: {
          hocKy: {
            maHocKy: hocKy.maHocKy,
            tenHocKy: hocKy.tenHocKy,
            ngayBatDau: hocKy.ngayBatDau,
            ngayKetThuc: hocKy.ngayKetThuc
          },
          targetGpa: command.targetGpa ?? null,
          focus: command.focus?.trim() || null,
          monHoc: thanhPhanTheoMon
        },
        maxOutputTokens: 900
      });

      const noiDung = PHAN_HOI_AI_SCHEMA.parse(ketQuaAi.output);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "INFO",
        action: "GRADE_AI_ADVICE_GENERATED",
        tableName: "thanh_phan_diem",
        message: "Sinh viên lấy gợi ý học tập bằng AI",
        metadata: {
          maHocKy: command.maHocKy,
          soMonHoc: monHoc.length,
          usedFallbackKey: ketQuaAi.usedKeyIndex > 0,
          model: ketQuaAi.model
        }
      });

      return {
        message: "Đã tạo gợi ý học tập bằng AI",
        maHocKy: command.maHocKy,
        targetGpa: command.targetGpa ?? null,
        ...noiDung
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiDiemSo.ghi({
        actorId: command.actorId,
        action: "GRADE_AI_ADVICE_FAILED",
        tableName: "thanh_phan_diem",
        message: "Không thể tạo gợi ý học tập bằng AI",
        error,
        metadata: {
          maHocKy: command.maHocKy,
          targetGpa: command.targetGpa ?? null
        }
      });

      throw LoiUngDung.khongTheXuLy("Hệ thống AI đang bận, vui lòng thử lại sau");
    }
  }
}
