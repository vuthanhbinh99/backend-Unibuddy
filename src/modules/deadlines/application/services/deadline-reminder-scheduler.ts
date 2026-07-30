import { nhatKy } from "../../../../shared/logger/logger.js";
import type { DichVuQuetNhacNhoDeadline } from "./deadline-reminder-scanner.service.js";

/** Chu kỳ quét nhắc nhở deadline mặc định (mili giây). */
export const CHU_KY_QUET_NHAC_NHO_MS = 60 * 1000;

/**
 * Khởi động vòng lặp quét nhắc nhở deadline theo chu kỳ.
 * Trả về hàm dừng để gọi khi tắt server.
 */
export const batDauQuetNhacNhoDeadline = (
  dichVuQuet: DichVuQuetNhacNhoDeadline,
  chuKyMs = CHU_KY_QUET_NHAC_NHO_MS
): (() => void) => {
  let dangDung = false;

  const chay = () => {
    if (dangDung) {
      return;
    }
    void dichVuQuet.quetMotLuot().catch((error) => {
      nhatKy.error("Lỗi ngoài ý muốn trong vòng lặp nhắc nhở deadline", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    });
  };

  // Chạy ngay một lượt để không phải chờ hết chu kỳ đầu tiên.
  chay();

  const boDinhGio = setInterval(chay, chuKyMs);
  if (typeof boDinhGio.unref === "function") {
    boDinhGio.unref();
  }

  return () => {
    dangDung = true;
    clearInterval(boDinhGio);
  };
};
