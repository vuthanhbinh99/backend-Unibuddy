import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoLocNguoiNhanThongBao } from "../../domain/system-notification.js";
import type { DichVuGuiThongBaoDay } from "../ports/push-notification.provider.js";
import type { KhoThongBaoHeThong } from "../ports/system-notification.repository.js";

export type LenhGuiThongBaoHeThong = {
  actorId: string;
  title: string;
  content: string;
  target: BoLocNguoiNhanThongBao;
  data?: Record<string, string>;
};

type PhuThuoc = {
  khoThongBaoHeThong: KhoThongBaoHeThong;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  dichVuGuiThongBaoDay: DichVuGuiThongBaoDay;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyGuiThongBaoHeThong {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhGuiThongBaoHeThong) {
    const recipients = await this.deps.khoThongBaoHeThong.timNguoiNhan(command.target);

    if (recipients.length === 0) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "WARNING",
        action: "SYSTEM_NOTIFICATION_NO_RECIPIENTS",
        tableName: "thong_bao",
        message: "Quan tri vien gui thong bao he thong nhung khong co nguoi nhan phu hop",
        metadata: {
          target: command.target
        }
      });

      return {
        recipientCount: 0,
        notificationCount: 0,
        fcm: {
          configured: false,
          tokenCount: 0,
          successCount: 0,
          failureCount: 0,
          invalidTokenCount: 0
        }
      };
    }

    const notificationRecords = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      const created = await this.deps.khoThongBaoHeThong.taoNhieu(
        {
          actorId: command.actorId,
          title: command.title,
          content: command.content,
          recipients
        },
        tx
      );

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId,
          level: "INFO",
          action: "SYSTEM_NOTIFICATION_CREATED",
          tableName: "thong_bao",
          message: "Quan tri vien tao thong bao he thong",
          metadata: {
            recipientCount: recipients.length,
            notificationCount: created.length,
            target: command.target
          }
        },
        tx
      );

      return created;
    });

    const fcmTokens = await this.deps.khoThongBaoHeThong.layFcmTokenCuaNguoiNhan(
      recipients.map((recipient) => recipient.userId)
    );

    if (fcmTokens.length === 0) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "WARNING",
        action: "SYSTEM_NOTIFICATION_NO_FCM_TOKENS",
        tableName: "thong_bao",
        message: "Thong bao he thong da luu nhung khong co FCM token dang hoat dong",
        metadata: {
          recipientCount: recipients.length,
          notificationCount: notificationRecords.length
        }
      });

      return {
        recipientCount: recipients.length,
        notificationCount: notificationRecords.length,
        fcm: {
          configured: false,
          tokenCount: 0,
          successCount: 0,
          failureCount: 0,
          invalidTokenCount: 0
        }
      };
    }

    try {
      const ketQuaGui = await this.deps.dichVuGuiThongBaoDay.guiDenTokens({
        tokens: fcmTokens.map((item) => item.token),
        title: command.title,
        body: command.content,
        data: {
          type: "HE_THONG",
          ...command.data
        }
      });

      if (ketQuaGui.invalidTokens.length) {
        await this.deps.khoThongBaoHeThong.xoaFcmTokenKhongHopLe(ketQuaGui.invalidTokens);
      }

      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: ketQuaGui.failureCount > 0 ? "WARNING" : "INFO",
        action: "SYSTEM_NOTIFICATION_PUSH_DISPATCHED",
        tableName: "thong_bao",
        message: "Quan tri vien day thong bao he thong qua Firebase FCM",
        metadata: {
          firebaseConfigured: ketQuaGui.configured,
          tokenCount: fcmTokens.length,
          successCount: ketQuaGui.successCount,
          failureCount: ketQuaGui.failureCount,
          invalidTokenCount: ketQuaGui.invalidTokens.length
        }
      });

      return {
        recipientCount: recipients.length,
        notificationCount: notificationRecords.length,
        fcm: {
          configured: ketQuaGui.configured,
          tokenCount: fcmTokens.length,
          successCount: ketQuaGui.successCount,
          failureCount: ketQuaGui.failureCount,
          invalidTokenCount: ketQuaGui.invalidTokens.length
        }
      };
    } catch (error) {
      await this.deps.khoNhatKyHeThong.tao({
        actorId: command.actorId,
        level: "ERROR",
        action: "SYSTEM_NOTIFICATION_PUSH_FAILED",
        tableName: "thong_bao",
        message: "Day thong bao he thong qua Firebase FCM that bai",
        metadata: {
          tokenCount: fcmTokens.length,
          errorName: error instanceof Error ? error.name : "UnknownError"
        }
      });

      return {
        recipientCount: recipients.length,
        notificationCount: notificationRecords.length,
        fcm: {
          configured: true,
          tokenCount: fcmTokens.length,
          successCount: 0,
          failureCount: fcmTokens.length,
          invalidTokenCount: 0
        }
      };
    }
  }
}
