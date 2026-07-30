import type { LoaiModule } from "../../domain/assistant.js";
import type { KhoDiemSo } from "../../../grades/application/ports/grade.repository.js";
import type { KhoLichHoc } from "../../../schedules/application/ports/schedule.repository.js";
import type { KhoDeadline } from "../../../deadlines/application/ports/deadline.repository.js";
import type { KhoFlashcard } from "../../../flashcards/application/ports/flashcard.repository.js";

type PhuThuoc = {
  khoDiemSo: KhoDiemSo;
  khoLichHoc: KhoLichHoc;
  khoDeadline: KhoDeadline;
  khoFlashcard: KhoFlashcard;
};

/**
 * RAG nhẹ: lấy dữ liệu thật của chính sinh viên theo module router đoán được,
 * để tầng trả lời chỉ nói dựa trên dữ liệu này (không bịa).
 * Module không map (khac / study-groups / documents) trả payload rỗng.
 */
export class DichVuGroundingTroLy {
  constructor(private readonly deps: PhuThuoc) {}

  async lay(module: LoaiModule, actorId: string): Promise<Record<string, unknown>> {
    switch (module) {
      case "grades":
        return this.layDiemSo(actorId);
      case "schedules":
        return this.layLichHoc(actorId);
      case "deadlines":
        return this.layDeadline(actorId);
      case "flashcards":
        return this.layFlashcard(actorId);
      default:
        return {};
    }
  }

  private async layDiemSo(actorId: string): Promise<Record<string, unknown>> {
    const monHoc = await this.deps.khoDiemSo.lietKeMonHocBangDiem({ actorId });

    const chiTiet = await Promise.all(
      monHoc.map(async (mon) => ({
        tenMon: mon.tenMon,
        maMon: mon.maMon,
        soTinChi: mon.soTinChi,
        tenHocKy: mon.tenHocKy,
        thanhPhan: (await this.deps.khoDiemSo.lietKeThanhPhanTheoMon(mon.maMonHoc)).map((tp) => ({
          tenThanhPhan: tp.tenThanhPhan,
          trongSo: tp.trongSo,
          diem: tp.diem
        }))
      }))
    );

    return { diemSo: chiTiet };
  }

  private async layLichHoc(actorId: string): Promise<Record<string, unknown>> {
    const lichHoc = await this.deps.khoLichHoc.lietKeTheoSinhVien(actorId);

    return {
      lichHoc: lichHoc.map((lich) => ({
        tenMon: lich.tenMon,
        maMon: lich.maMon,
        tenHocKy: lich.tenHocKy,
        thu: lich.thu,
        tietBatDau: lich.tietBatDau,
        soTiet: lich.soTiet,
        phongHoc: lich.phongHoc,
        ngayBatDau: lich.ngayBatDau,
        ngayKetThuc: lich.ngayKetThuc
      }))
    };
  }

  private async layDeadline(actorId: string): Promise<Record<string, unknown>> {
    const deadline = await this.deps.khoDeadline.lietKe({ actorId });

    return {
      deadline: deadline.map((item) => ({
        tenMon: item.tenMon,
        tieuDe: item.tieuDe,
        moTa: item.moTa,
        hanNop: item.hanNop,
        trangThai: item.trangThai
      }))
    };
  }

  private async layFlashcard(actorId: string): Promise<Record<string, unknown>> {
    const [boThe, thongKe] = await Promise.all([
      this.deps.khoFlashcard.lietKeBoCuaSinhVien({ actorId }),
      this.deps.khoFlashcard.layThongKe(actorId)
    ]);

    return {
      thongKe: {
        tongSoBo: thongKe.tongSoBo,
        tongSoThe: thongKe.tongSoThe,
        soTheCanOnHomNay: thongKe.soTheCanOnHomNay,
        soTheDaThuoc: thongKe.soTheDaThuoc,
        tyLeThuocBai: thongKe.tyLeThuocBai
      },
      boThe: boThe.map((bo) => ({
        tenBo: bo.tenBo,
        tenMon: bo.tenMon,
        soThe: bo.soThe,
        soTheCanOn: bo.soTheCanOn
      }))
    };
  }
}
