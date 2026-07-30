import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { DichVuGuiThongBaoDay } from "../../../notifications/application/ports/push-notification.provider.js";
import type {
  DuLieuThongBaoNhacDeadline,
  KhoThongBaoNhacDeadline
} from "../../../notifications/application/ports/deadline-notification.repository.js";
import type { KhoLichThi } from "../../../exams/application/ports/exam.repository.js";
import type { NhacNhoLichThiDenHan } from "../../../exams/domain/exam.js";
import { nhatKy } from "../../../../shared/logger/logger.js";
import type { KhoDeadline, NhacNhoDenHan } from "../ports/deadline.repository.js";

/** Số nhắc nhở tối đa xử lý trong một lượt quét để tránh giữ khóa quá lâu. */
const GIOI_HAN_MOI_LUOT = 200;

const MOT_GIO_MS = 60 * 60 * 1000;

type PhuThuoc = {
  khoDeadline: KhoDeadline;
  khoLichThi?: KhoLichThi;
  khoThongBaoNhacDeadline: KhoThongBaoNhacDeadline;
  dichVuGuiThongBaoDay: DichVuGuiThongBaoDay;
  khoNhatKyHeThong: KhoNhatKyHeThong;
};

export type KetQuaQuetNhacNho = {
  soNhacNho: number;
  soThongBaoDaTao: number;
  fcm: {
    tokenCount: number;
    successCount: number;
    failureCount: number;
    invalidTokenCount: number;
  };
};

const dinhDangKhoangThoiGian = (hanNop: Date, thoiGianNhac: Date) => {
  const soGio = Math.max(1, Math.round((hanNop.getTime() - thoiGianNhac.getTime()) / MOT_GIO_MS));
  return `${soGio} giờ`;
};

const taoNoiDungThongBao = (nhacNho: NhacNhoDenHan) => {
  const conLai = dinhDangKhoangThoiGian(nhacNho.hanNop, nhacNho.thoiGianNhac);
  return {
    tieuDe: `Sắp tới hạn: ${nhacNho.tieuDe}`,
    noiDung: `Deadline "${nhacNho.tieuDe}" của môn ${nhacNho.tenMon} sẽ tới hạn trong khoảng ${conLai} nữa. Hãy hoàn thành sớm nhé!`
  };
};

const dinhDangNgayGioThi = (thoiGianThi: Date) =>
  thoiGianThi.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

const taoNoiDungThongBaoLichThi = (nhacNho: NhacNhoLichThiDenHan) => ({
  tieuDe: `Ngày mai thi: ${nhacNho.tenMon}`,
  noiDung: `${nhacNho.tenMon} sẽ thi lúc ${dinhDangNgayGioThi(nhacNho.thoiGianThi)}${nhacNho.phongThi ? ` tại phòng ${nhacNho.phongThi}` : ""}${nhacNho.diaDiemThi ? `, ${nhacNho.diaDiemThi}` : ""}.`
});

/**
 * Tiến trình quét bảng `nhac_nho`: lấy các mốc đã tới hạn nhưng chưa gửi,
 * ghi thông báo trong ứng dụng (loai_thong_bao = 'DEADLINE') và đẩy push FCM.
 *
 * Việc "nhận và khóa" được thực hiện nguyên tử ở tầng repository nên an toàn
 * khi chạy nhiều tiến trình. Nếu bước gửi/ghi thông báo thất bại, các nhắc nhở
 * sẽ được trả về trạng thái chưa gửi để lượt quét sau thử lại.
 */
export class DichVuQuetNhacNhoDeadline {
  private dangChay = false;

  constructor(private readonly deps: PhuThuoc) {}

  async quetMotLuot(): Promise<KetQuaQuetNhacNho | null> {
    if (this.dangChay) {
      return null;
    }
    this.dangChay = true;

    try {
      const cacNhacNho = await this.deps.khoDeadline.nhanNhacNhoDenHanVaKhoa(GIOI_HAN_MOI_LUOT);
      const cacNhacNhoLichThi = this.deps.khoLichThi
        ? await this.deps.khoLichThi.nhanNhacNhoLichThiDenHanVaKhoa(GIOI_HAN_MOI_LUOT)
        : [];

      if (cacNhacNho.length === 0 && cacNhacNhoLichThi.length === 0) {
        return {
          soNhacNho: 0,
          soThongBaoDaTao: 0,
          fcm: { tokenCount: 0, successCount: 0, failureCount: 0, invalidTokenCount: 0 }
        };
      }

      const ketQuaDeadline = cacNhacNho.length > 0 ? await this.xuLyCacNhacNho(cacNhacNho) : this.ketQuaRong();
      const ketQuaLichThi =
        cacNhacNhoLichThi.length > 0 ? await this.xuLyCacNhacNhoLichThi(cacNhacNhoLichThi) : this.ketQuaRong();

      return {
        soNhacNho: ketQuaDeadline.soNhacNho + ketQuaLichThi.soNhacNho,
        soThongBaoDaTao: ketQuaDeadline.soThongBaoDaTao + ketQuaLichThi.soThongBaoDaTao,
        fcm: {
          tokenCount: ketQuaDeadline.fcm.tokenCount + ketQuaLichThi.fcm.tokenCount,
          successCount: ketQuaDeadline.fcm.successCount + ketQuaLichThi.fcm.successCount,
          failureCount: ketQuaDeadline.fcm.failureCount + ketQuaLichThi.fcm.failureCount,
          invalidTokenCount: ketQuaDeadline.fcm.invalidTokenCount + ketQuaLichThi.fcm.invalidTokenCount
        }
      };
    } catch (error) {
      nhatKy.error("Loi khi quet nhac nho deadline", {
        errorName: error instanceof Error ? error.name : "UnknownError"
      });
      return null;
    } finally {
      this.dangChay = false;
    }
  }

  private async xuLyCacNhacNho(cacNhacNho: NhacNhoDenHan[]): Promise<KetQuaQuetNhacNho> {
    const maNhacNhos = cacNhacNho.map((item) => item.maNhacNho);

    try {
      const duLieuThongBao: DuLieuThongBaoNhacDeadline[] = cacNhacNho.map((nhacNho) => {
        const { tieuDe, noiDung } = taoNoiDungThongBao(nhacNho);
        return {
          maNguoiNhan: nhacNho.maNguoiDung,
          maDeadline: nhacNho.maDeadline,
          tieuDe,
          noiDung
        };
      });

      const thongBaoDaTao = await this.deps.khoThongBaoNhacDeadline.taoNhieu(duLieuThongBao);

      const fcm = await this.dayPushChoNguoiNhan(cacNhacNho);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: null,
        level: fcm.failureCount > 0 ? "WARNING" : "INFO",
        action: "DEADLINE_REMINDER_DISPATCHED",
        tableName: "nhac_nho",
        message: "He thong gui nhac nho deadline toi han",
        metadata: {
          soNhacNho: cacNhacNho.length,
          soThongBaoDaTao: thongBaoDaTao.length,
          fcmTokenCount: fcm.tokenCount,
          fcmSuccessCount: fcm.successCount,
          fcmFailureCount: fcm.failureCount,
          fcmInvalidTokenCount: fcm.invalidTokenCount,
          ruleCode: "BR-SCH-03"
        }
      });

      return {
        soNhacNho: cacNhacNho.length,
        soThongBaoDaTao: thongBaoDaTao.length,
        fcm
      };
    } catch (error) {
      // Trả nhắc nhở về trạng thái chưa gửi để lượt quét sau thử lại.
      await this.deps.khoDeadline.danhDauNhacNhoChuaGui(maNhacNhos).catch(() => undefined);

      await this.deps.khoNhatKyHeThong
        .tao({
          actorId: null,
          level: "ERROR",
          action: "DEADLINE_REMINDER_DISPATCH_FAILED",
          tableName: "nhac_nho",
          message: "Gui nhac nho deadline that bai, da tra ve trang thai chua gui",
          metadata: {
            soNhacNho: cacNhacNho.length,
            errorName: error instanceof Error ? error.name : "UnknownError"
          }
        })
        .catch(() => undefined);

      throw error;
    }
  }

  private async xuLyCacNhacNhoLichThi(cacNhacNho: NhacNhoLichThiDenHan[]): Promise<KetQuaQuetNhacNho> {
    const maNhacNhos = cacNhacNho.map((item) => item.maNhacNho);

    try {
      const duLieuThongBao: DuLieuThongBaoNhacDeadline[] = cacNhacNho.map((nhacNho) => {
        const { tieuDe, noiDung } = taoNoiDungThongBaoLichThi(nhacNho);
        return {
          maNguoiNhan: nhacNho.maNguoiDung,
          maDeadline: null,
          tieuDe,
          noiDung,
          loaiThongBao: "NHAC_NHO"
        };
      });
      const thongBaoDaTao = await this.deps.khoThongBaoNhacDeadline.taoNhieu(duLieuThongBao);
      const fcm = await this.dayPushLichThiChoNguoiNhan(cacNhacNho);

      await this.deps.khoNhatKyHeThong.tao({
        actorId: null,
        level: fcm.failureCount > 0 ? "WARNING" : "INFO",
        action: "EXAM_REMINDER_DISPATCHED",
        tableName: "nhac_nho",
        message: "He thong gui nhac nho lich thi truoc 1 ngay",
        metadata: {
          soNhacNho: cacNhacNho.length,
          soThongBaoDaTao: thongBaoDaTao.length,
          fcmTokenCount: fcm.tokenCount,
          fcmSuccessCount: fcm.successCount,
          fcmFailureCount: fcm.failureCount,
          fcmInvalidTokenCount: fcm.invalidTokenCount
        }
      });

      return {
        soNhacNho: cacNhacNho.length,
        soThongBaoDaTao: thongBaoDaTao.length,
        fcm
      };
    } catch (error) {
      await this.deps.khoLichThi?.danhDauNhacNhoChuaGui(maNhacNhos).catch(() => undefined);

      await this.deps.khoNhatKyHeThong
        .tao({
          actorId: null,
          level: "ERROR",
          action: "EXAM_REMINDER_DISPATCH_FAILED",
          tableName: "nhac_nho",
          message: "Gui nhac nho lich thi that bai, da tra ve trang thai chua gui",
          metadata: {
            soNhacNho: cacNhacNho.length,
            errorName: error instanceof Error ? error.name : "UnknownError"
          }
        })
        .catch(() => undefined);

      throw error;
    }
  }

  private async dayPushChoNguoiNhan(cacNhacNho: NhacNhoDenHan[]) {
    const userIds = [...new Set(cacNhacNho.map((item) => item.maNguoiDung))];
    const fcmTokens = await this.deps.khoThongBaoNhacDeadline.layFcmTokenCuaNguoiNhan(userIds);

    if (fcmTokens.length === 0) {
      return { tokenCount: 0, successCount: 0, failureCount: 0, invalidTokenCount: 0 };
    }

    const dauTien = cacNhacNho[0];
    const nhieuNhacNho = cacNhacNho.length > 1;
    const { tieuDe, noiDung } = taoNoiDungThongBao(dauTien);

    const ketQuaGui = await this.deps.dichVuGuiThongBaoDay.guiDenTokens({
      tokens: fcmTokens.map((item) => item.token),
      title: nhieuNhacNho ? "Bạn có deadline sắp tới hạn" : tieuDe,
      body: nhieuNhacNho
        ? `Bạn có ${cacNhacNho.length} deadline sắp tới hạn. Mở UniBuddy để xem chi tiết.`
        : noiDung,
      data: {
        type: "DEADLINE",
        maDeadline: dauTien.maDeadline
      }
    });

    if (ketQuaGui.invalidTokens.length) {
      await this.deps.khoThongBaoNhacDeadline
        .xoaFcmTokenKhongHopLe(ketQuaGui.invalidTokens)
        .catch(() => undefined);
    }

    return {
      tokenCount: fcmTokens.length,
      successCount: ketQuaGui.successCount,
      failureCount: ketQuaGui.failureCount,
      invalidTokenCount: ketQuaGui.invalidTokens.length
    };
  }

  private async dayPushLichThiChoNguoiNhan(cacNhacNho: NhacNhoLichThiDenHan[]) {
    const userIds = [...new Set(cacNhacNho.map((item) => item.maNguoiDung))];
    const fcmTokens = await this.deps.khoThongBaoNhacDeadline.layFcmTokenCuaNguoiNhan(userIds);

    if (fcmTokens.length === 0) {
      return { tokenCount: 0, successCount: 0, failureCount: 0, invalidTokenCount: 0 };
    }

    const dauTien = cacNhacNho[0];
    const nhieuNhacNho = cacNhacNho.length > 1;
    const { tieuDe, noiDung } = taoNoiDungThongBaoLichThi(dauTien);
    const ketQuaGui = await this.deps.dichVuGuiThongBaoDay.guiDenTokens({
      tokens: fcmTokens.map((item) => item.token),
      title: nhieuNhacNho ? "Ngày mai bạn có lịch thi" : tieuDe,
      body: nhieuNhacNho ? `Bạn có ${cacNhacNho.length} môn thi vào ngày mai. Mở UniBuddy để xem chi tiết.` : noiDung,
      data: {
        type: "EXAM",
        maLichThi: dauTien.maLichThi
      }
    });

    if (ketQuaGui.invalidTokens.length) {
      await this.deps.khoThongBaoNhacDeadline
        .xoaFcmTokenKhongHopLe(ketQuaGui.invalidTokens)
        .catch(() => undefined);
    }

    return {
      tokenCount: fcmTokens.length,
      successCount: ketQuaGui.successCount,
      failureCount: ketQuaGui.failureCount,
      invalidTokenCount: ketQuaGui.invalidTokens.length
    };
  }

  private ketQuaRong(): KetQuaQuetNhacNho {
    return {
      soNhacNho: 0,
      soThongBaoDaTao: 0,
      fcm: { tokenCount: 0, successCount: 0, failureCount: 0, invalidTokenCount: 0 }
    };
  }
}
