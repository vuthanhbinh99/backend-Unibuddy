import { LoiUngDung } from "../errors/app-error.js";

type CauHinhGemini = {
  model: string;
  apiKeys: string[];
  timeoutMs: number;
  maxOutputTokens: number;
  temperature: number;
};

type LenhSinhJson = {
  systemPrompt: string;
  userPayload: Record<string, unknown>;
  maxOutputTokens?: number;
};

type KetQuaSinhJson<T> = {
  output: T;
  model: string;
  usedKeyIndex: number;
};

export type VaiTroChat = "user" | "model";
export type LuotChat = { role: VaiTroChat; text: string };

type LenhSinhChat = {
  systemPrompt: string;
  lichSu: LuotChat[]; // nhiều lượt để giữ ngữ cảnh
  maxOutputTokens?: number;
  temperature?: number; // cho phép override (answer nên cao hơn router)
};

type KetQuaSinhChat = {
  text: string;
  model: string;
  usedKeyIndex: number;
};

type PhanHoiGemini = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type KetQuaGoiGemini = {
  text: string;
  usedKeyIndex: number;
};

const LOI_CAU_HINH = "Gemini API chưa được cấu hình. Vui lòng thiết lập GEMINI_API_KEY_PRIMARY trong .env";
const LOI_MODEL = "Mô hình Gemini đang cấu hình không còn được hỗ trợ. Hãy cập nhật GEMINI_MODEL trong .env";

const tachJson = (text: string) => {
  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  return trimmed;
};

// Một số model (gemini-flash-latest / gemini-3) thỉnh thoảng trả JSON bị cắt cụt
// dấu đóng } hoặc ] ở cuối dù finishReason = STOP. Hàm này bù lại các dấu đóng
// còn thiếu theo đúng thứ tự lồng nhau, bỏ qua ký tự nằm trong chuỗi.
const vaDauDongThieu = (json: string) => {
  const nganXep: string[] = [];
  let trongChuoi = false;
  let thoat = false;

  for (const kyTu of json) {
    if (thoat) {
      thoat = false;
      continue;
    }

    if (trongChuoi) {
      if (kyTu === "\\") {
        thoat = true;
      } else if (kyTu === '"') {
        trongChuoi = false;
      }
      continue;
    }

    if (kyTu === '"') {
      trongChuoi = true;
    } else if (kyTu === "{") {
      nganXep.push("}");
    } else if (kyTu === "[") {
      nganXep.push("]");
    } else if (kyTu === "}" || kyTu === "]") {
      nganXep.pop();
    }
  }

  let ketQua = json;

  // Chuỗi chưa đóng (JSON bị cắt giữa một giá trị string) → đóng lại trước.
  if (trongChuoi) {
    ketQua += '"';
  }

  while (nganXep.length > 0) {
    ketQua += nganXep.pop();
  }

  return ketQua;
};

// Parse JSON chịu lỗi: thử parse thẳng, nếu vỡ thì vá dấu đóng còn thiếu rồi thử lại.
const phanTichJsonChiuLoi = <T>(jsonText: string): T => {
  try {
    return JSON.parse(jsonText) as T;
  } catch (loiDau) {
    const daVa = vaDauDongThieu(jsonText);

    if (daVa !== jsonText) {
      return JSON.parse(daVa) as T;
    }

    throw loiDau;
  }
};

// Lỗi tạm thời từ Gemini: nên thử lại chính key đó với backoff (server bận / quá tải / rate limit).
const laLoiTamThoi = (statusCode: number) => statusCode === 429 || statusCode >= 500;

// Lỗi do key hỏng (sai/hết hạn/không đủ quyền): retry cùng key vô ích → sang key khác ngay.
const laLoiKeyHong = (statusCode: number) => statusCode === 401 || statusCode === 403;

// Các mốc chờ tăng dần giữa những lần thử lại cùng một key cho lỗi tạm thời.
const CAC_DO_TRE_THU_LAI_MS = [500, 800, 1000];

const nghi = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class DichVuGeminiAi {
  constructor(private readonly cauHinh: CauHinhGemini) {}

  async sinhJson<T>(lenh: LenhSinhJson): Promise<KetQuaSinhJson<T>> {
    const { text, usedKeyIndex } = await this.goiGemini({
      system_instruction: {
        parts: [{ text: lenh.systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: JSON.stringify(lenh.userPayload)
            }
          ]
        }
      ],
      generationConfig: {
        temperature: this.cauHinh.temperature,
        maxOutputTokens: lenh.maxOutputTokens ?? this.cauHinh.maxOutputTokens,
        responseMimeType: "application/json",
        // Các model *-latest / gemini-3 là model "thinking": nếu không tắt,
        // token suy nghĩ sẽ ăn hết maxOutputTokens khiến JSON bị cắt (MAX_TOKENS).
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const jsonText = tachJson(text);
    const output = phanTichJsonChiuLoi<T>(jsonText);

    return {
      output,
      model: this.cauHinh.model,
      usedKeyIndex
    };
  }

  async sinhChat(lenh: LenhSinhChat): Promise<KetQuaSinhChat> {
    if (lenh.lichSu.length === 0) {
      throw LoiUngDung.khongTheXuLy("Cuộc hội thoại chưa có nội dung để xử lý");
    }

    const { text, usedKeyIndex } = await this.goiGemini({
      system_instruction: {
        parts: [{ text: lenh.systemPrompt }]
      },
      contents: lenh.lichSu.map((luot) => ({
        role: luot.role,
        parts: [{ text: luot.text }]
      })),
      generationConfig: {
        temperature: lenh.temperature ?? this.cauHinh.temperature,
        maxOutputTokens: lenh.maxOutputTokens ?? this.cauHinh.maxOutputTokens,
        // Chat là văn bản thường nên không đặt responseMimeType JSON.
        // Vẫn tắt thinking để tránh token suy nghĩ ăn hết maxOutputTokens.
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return {
      text: text.trim(),
      model: this.cauHinh.model,
      usedKeyIndex
    };
  }

  private async goiGemini(body: Record<string, unknown>): Promise<KetQuaGoiGemini> {
    if (this.cauHinh.apiKeys.length === 0) {
      throw LoiUngDung.khongTheXuLy(LOI_CAU_HINH);
    }

    let loiCuoi: string | null = null;
    let loiCuoiLaTamThoi = false;

    for (let index = 0; index < this.cauHinh.apiKeys.length; index += 1) {
      const apiKey = this.cauHinh.apiKeys[index];
      const laKeyCuoi = index === this.cauHinh.apiKeys.length - 1;
      // Tổng số lần thử cho một key = 1 lần đầu + số mốc backoff dành cho lỗi tạm thời.
      const soLanThuToiDa = CAC_DO_TRE_THU_LAI_MS.length + 1;

      for (let lanThu = 0; lanThu < soLanThuToiDa; lanThu += 1) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.cauHinh.timeoutMs);

        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.cauHinh.model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              signal: controller.signal,
              body: JSON.stringify(body)
            }
          );

          const rawBody = await response.text();

          if (!response.ok) {
            loiCuoi = rawBody || response.statusText;

            if (response.status === 404) {
              throw LoiUngDung.khongTheXuLy(LOI_MODEL);
            }

            if (laLoiTamThoi(response.status)) {
              loiCuoiLaTamThoi = true;
              const doTre = CAC_DO_TRE_THU_LAI_MS[lanThu];

              // Còn lượt retry cho chính key này → chờ backoff rồi thử lại cùng key.
              if (doTre !== undefined) {
                await nghi(doTre);
                continue;
              }

              // Đã hết lượt retry cùng key: sang key kế tiếp nếu còn.
              if (!laKeyCuoi) {
                break;
              }

              throw LoiUngDung.dichVuBan("Dịch vụ AI đang bận, vui lòng thử lại sau ít phút");
            }

            // Lỗi do key hỏng: đổi key ngay, không retry cùng key.
            if (laLoiKeyHong(response.status) && !laKeyCuoi) {
              break;
            }

            throw LoiUngDung.khongTheXuLy("Không thể kết nối dịch vụ AI lúc này");
          }

          const parsed = JSON.parse(rawBody) as PhanHoiGemini;
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!text) {
            throw LoiUngDung.khongTheXuLy("Dịch vụ AI chưa trả về nội dung hợp lệ");
          }

          return {
            text,
            usedKeyIndex: index
          };
        } catch (error) {
          if (error instanceof LoiUngDung) {
            throw error;
          }

          // Lỗi mạng/timeout (fetch abort, DNS...) là lỗi tạm thời: retry cùng key với backoff.
          loiCuoiLaTamThoi = true;
          loiCuoi = error instanceof Error ? error.message : String(error);
          const doTre = CAC_DO_TRE_THU_LAI_MS[lanThu];

          if (doTre !== undefined) {
            await nghi(doTre);
            continue;
          }

          if (!laKeyCuoi) {
            break;
          }

          throw LoiUngDung.dichVuBan(`Dịch vụ AI đang bận, vui lòng thử lại sau ít phút (${loiCuoi})`);
        } finally {
          clearTimeout(timeoutId);
        }
      }
    }

    // Đã duyệt hết key mà không thành công.
    if (loiCuoiLaTamThoi) {
      throw LoiUngDung.dichVuBan("Dịch vụ AI đang bận, vui lòng thử lại sau ít phút");
    }

    throw LoiUngDung.khongTheXuLy(`Không thể xử lý yêu cầu AI lúc này${loiCuoi ? ` (${loiCuoi})` : ""}`);
  }
}
