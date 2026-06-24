import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { CacLoi } from "../../../../shared/errors/error-codes.js";
import type { KhoDeadline } from "../ports/deadline.repository.js";
import type { DichVuGhiLogLoiDeadline } from "../services/deadline-error-logger.service.js";
import { tinhCacMocNhacDeadlineMacDinh } from "../services/deadline-reminder.service.js";

export type LenhTaoDeadline = {
  actorId: string;
  maMonHoc?: string | null;
  tieuDe?: string | null;
  moTa?: string | null;
  hanNop?: string | Date | null;
};

type PhuThuoc = {
  khoDeadline: KhoDeadline;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGhiLogLoiDeadline: DichVuGhiLogLoiDeadline;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class XuLyTaoDeadline {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoDeadline) {
    const duLieuHopLe = await this.chuanHoaVaKiemTra(command);
    const monHoc = await this.deps.khoDeadline.timMonHocCuaSinhVien(duLieuHopLe.maMonHoc, command.actorId);

    if (!monHoc) {
      await this.deps.dichVuGhiLogLoiDeadline.ghiCanhBao({
        actorId: command.actorId,
        action: "DEADLINE_CREATE_COURSE_FORBIDDEN",
        tableName: "deadline",
        message: "Sinh viên thêm deadline thất bại vì môn học không thuộc sinh viên",
        metadata: {
          maMonHoc: duLieuHopLe.maMonHoc
        }
      });
      throw LoiUngDung.khongCoQuyen("Không thể thêm deadline cho môn học không thuộc sinh viên");
    }

    try {
      const ketQua = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
        const deadline = await this.deps.khoDeadline.tao(
          {
            ...duLieuHopLe,
            trangThai: "CHUA_LAM"
          },
          tx
        );
        const cacMocNhac = tinhCacMocNhacDeadlineMacDinh(deadline.hanNop);
        const nhacNho = await this.deps.khoDeadline.taoNhacNhoNhieu(
          {
            maNguoiDung: command.actorId,
            maDeadline: deadline.maDeadline,
            thoiGianNhac: cacMocNhac.map((item) => item.thoiGianNhac)
          },
          tx
        );

        await this.deps.khoNhatKyHeThong.tao(
          {
            actorId: command.actorId,
            level: "INFO",
            action: "DEADLINE_CREATED",
            tableName: "deadline",
            recordId: deadline.maDeadline,
            message: "Sinh viên thêm mới deadline cá nhân thành công",
            metadata: {
              maDeadline: deadline.maDeadline,
              maMonHoc: deadline.maMonHoc,
              maMon: monHoc.maMon,
              tenMon: monHoc.tenMon,
              tieuDe: deadline.tieuDe,
              hanNop: deadline.hanNop.toISOString(),
              soNhacNhoDaTao: nhacNho.length,
              reminderOffsetsHours: cacMocNhac.map((item) => item.soGioTruocHan),
              ruleCode: "BR-SCH-03"
            }
          },
          tx
        );

        return { deadline, nhacNho };
      });

      return {
        message: "Thêm mới deadline thành công! Hệ thống đã tự động hẹn lịch nhắc nhở.",
        deadline: ketQua.deadline,
        nhacNho: ketQua.nhacNho
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      await this.deps.dichVuGhiLogLoiDeadline.ghi({
        actorId: command.actorId,
        action: "DEADLINE_CREATE_FAILED",
        tableName: "deadline",
        message: "Lỗi Database Transaction khi tạo deadline",
        error,
        metadata: {
          maMonHoc: duLieuHopLe.maMonHoc,
          tieuDe: duLieuHopLe.tieuDe,
          hanNop: duLieuHopLe.hanNop.toISOString()
        }
      });
      throw new LoiUngDung(500, CacLoi.INTERNAL_ERROR, "Hệ thống gặp sự cố lưu trữ, vui lòng thử lại sau!");
    }
  }

  private async chuanHoaVaKiemTra(command: LenhTaoDeadline) {
    const tieuDe = command.tieuDe?.trim() ?? "";
    const maMonHoc = command.maMonHoc?.trim() ?? "";
    const moTa = command.moTa?.trim() || null;
    const hanNop = command.hanNop instanceof Date ? command.hanNop : new Date(String(command.hanNop ?? ""));
    const loi: string[] = [];

    if (!tieuDe) {
      loi.push("Tiêu đề deadline không được để trống");
    }

    if (tieuDe.length > 255) {
      loi.push("Tiêu đề deadline không được vượt quá 255 ký tự");
    }

    if (!maMonHoc || !UUID_PATTERN.test(maMonHoc)) {
      loi.push("Mã môn học không hợp lệ");
    }

    if (!Number.isFinite(hanNop.getTime())) {
      loi.push("Hạn nộp không hợp lệ");
    } else if (hanNop.getTime() <= Date.now()) {
      loi.push("Hạn nộp phải lớn hơn thời gian hiện tại");
    }

    if (loi.length > 0) {
      await this.deps.dichVuGhiLogLoiDeadline.ghiCanhBao({
        actorId: command.actorId,
        action: "DEADLINE_CREATE_VALIDATION_FAILED",
        tableName: "deadline",
        message: "Yêu cầu thêm deadline thất bại do lỗi Validation",
        metadata: {
          errors: loi,
          hasTitle: Boolean(tieuDe),
          maMonHoc: maMonHoc || null
        }
      });
      throw LoiUngDung.yeuCauSai("Vui lòng nhập đầy đủ và chính xác thông tin!", loi);
    }

    return {
      maMonHoc,
      tieuDe,
      moTa,
      hanNop
    };
  }
}
