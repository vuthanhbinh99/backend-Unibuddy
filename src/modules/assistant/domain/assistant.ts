export const CAC_MODULE = [
  "grades",
  "schedules",
  "deadlines",
  "flashcards",
  "study-groups",
  "documents",
  "khac"
] as const;

export type LoaiModule = (typeof CAC_MODULE)[number];

export type KetQuaPhanLoai = {
  trongPhamVi: boolean;
  module: LoaiModule;
  doTinCay: number; // 0..1
  lyDoTuChoi: string | null;
};

export type VaiTroTinNhan = "user" | "assistant";

export type TinNhan = {
  vaiTro: VaiTroTinNhan;
  noiDung: string;
};

export const laLoaiModule = (value: string): value is LoaiModule =>
  CAC_MODULE.includes(value as LoaiModule);

/**
 * Khai báo capabilities một chỗ duy nhất: cả router prompt lẫn câu từ chối cùng đọc từ đây.
 */
export type MoTaModule = {
  module: LoaiModule;
  ten: string;
  moTa: string;
};

export const CAPABILITIES: readonly MoTaModule[] = [
  { module: "grades", ten: "Điểm số & GPA", moTa: "Xem bảng điểm, tính GPA, tư vấn cải thiện kết quả học tập" },
  { module: "schedules", ten: "Thời khóa biểu", moTa: "Lịch học các môn theo tuần, phòng học, tiết học" },
  { module: "deadlines", ten: "Deadline", moTa: "Hạn nộp bài tập, trạng thái công việc cần hoàn thành" },
  { module: "flashcards", ten: "Flashcard", moTa: "Bộ thẻ ôn tập, tiến độ ghi nhớ, thẻ cần ôn" },
  { module: "study-groups", ten: "Nhóm học tập", moTa: "Nhóm học chung, thành viên, hoạt động nhóm" },
  { module: "documents", ten: "Tài liệu", moTa: "Tài liệu học tập được chia sẻ" },
  { module: "khac", ten: "Khác", moTa: "Không thuộc phạm vi hỗ trợ học tập của UniBuddy" }
] as const;

/**
 * Ngưỡng độ tin cậy tối thiểu để orchestrator gọi tầng trả lời.
 * Dưới ngưỡng này sẽ từ chối sớm để tiết kiệm token.
 */
export const NGUONG_DO_TIN_CAY = 0.5;

export const moTaCapabilitiesChoNguoiDung = () =>
  CAPABILITIES.filter((item) => item.module !== "khac")
    .map((item) => `• ${item.ten}: ${item.moTa}`)
    .join("\n");
