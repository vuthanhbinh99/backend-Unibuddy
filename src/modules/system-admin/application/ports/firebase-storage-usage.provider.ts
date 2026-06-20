import type { ThongKeDungLuongFirebase } from "../../domain/storage-usage.js";

export interface DichVuDungLuongFirebase {
  layThongKeDungLuong(): Promise<ThongKeDungLuongFirebase>;
}
