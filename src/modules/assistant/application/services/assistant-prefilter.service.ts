export type KetQuaPrefilter = {
  chan: boolean;
  lyDo?: string;
};

const DO_DAI_TOI_DA = 2000;

// Các mẫu prompt-injection cơ bản. Cố ý giữ hẹp để tránh chặn nhầm câu hỏi học tập.
const CAC_MAU_TIEM_NHIEM: RegExp[] = [
  /\bbỏ qua (mọi |các |những )?(hướng dẫn|chỉ dẫn|quy tắc|ràng buộc)/i,
  /\bignore (all |the )?(previous|above|prior|earlier) (instructions|prompts|rules)/i,
  /\byou are now\b/i,
  /\bbạn (bây giờ |giờ )?(là|đóng vai)\b.*\b(dan|jailbreak|không giới hạn)\b/i,
  /\bsystem prompt\b/i,
  /\b(quên|bỏ) (đi )?vai trò\b/i,
  /\breveal (your )?(system )?(prompt|instructions)/i,
  /\b(lộ|tiết lộ|in ra) (prompt|system prompt|api key|khóa)/i
];

export class DichVuPrefilterTroLy {
  kiemTra(message: string): KetQuaPrefilter {
    const noiDung = message.trim();

    if (noiDung.length === 0) {
      return { chan: true, lyDo: "Câu hỏi trống, bạn hãy nhập nội dung cần hỏi nhé." };
    }

    if (noiDung.length > DO_DAI_TOI_DA) {
      return {
        chan: true,
        lyDo: `Câu hỏi quá dài (tối đa ${DO_DAI_TOI_DA} ký tự). Bạn hãy rút gọn lại giúp mình nhé.`
      };
    }

    const dinhTiemNhiem = CAC_MAU_TIEM_NHIEM.some((mau) => mau.test(noiDung));

    if (dinhTiemNhiem) {
      return {
        chan: true,
        lyDo: "Mình chỉ hỗ trợ các câu hỏi liên quan đến học tập trên UniBuddy thôi nhé."
      };
    }

    return { chan: false };
  }
}
