import type { ThongKeDungLuongNoiBo } from "../../domain/storage-usage.js";

export interface KhoDungLuongHeThong {
  layThongKeNoiBo(): Promise<ThongKeDungLuongNoiBo>;
}
