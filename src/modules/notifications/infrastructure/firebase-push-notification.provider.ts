import { getMessaging, type MulticastMessage } from "firebase-admin/messaging";
import type { CauHinhFirebase } from "../../../shared/firebase/firebase-admin-app.js";
import { layUngDungFirebaseAdmin } from "../../../shared/firebase/firebase-admin-app.js";
import type {
  DichVuGuiThongBaoDay,
  KetQuaGuiThongBaoDay,
  LenhGuiThongBaoDay
} from "../application/ports/push-notification.provider.js";

const SO_TOKEN_MOI_LO = 500;
const CAC_LOI_TOKEN_KHONG_HOP_LE = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "invalid-registration-token",
  "registration-token-not-registered"
]);

const chiaLo = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const laLoiTokenKhongHopLe = (code: unknown) => typeof code === "string" && CAC_LOI_TOKEN_KHONG_HOP_LE.has(code);

export class DichVuGuiThongBaoDayFirebase implements DichVuGuiThongBaoDay {
  constructor(private readonly cauHinhFirebase: CauHinhFirebase) {}

  async guiDenTokens(command: LenhGuiThongBaoDay): Promise<KetQuaGuiThongBaoDay> {
    const tokens = [...new Set(command.tokens.filter(Boolean))];

    if (tokens.length === 0) {
      return {
        configured: Boolean(layUngDungFirebaseAdmin(this.cauHinhFirebase)),
        successCount: 0,
        failureCount: 0,
        invalidTokens: []
      };
    }

    const ungDung = layUngDungFirebaseAdmin(this.cauHinhFirebase);

    if (!ungDung) {
      return {
        configured: false,
        successCount: 0,
        failureCount: tokens.length,
        invalidTokens: []
      };
    }

    const messaging = getMessaging(ungDung);
    let successCount = 0;
    let failureCount = 0;
    const invalidTokens: string[] = [];

    for (const loTokens of chiaLo(tokens, SO_TOKEN_MOI_LO)) {
      const message: MulticastMessage = {
        tokens: loTokens,
        notification: {
          title: command.title,
          body: command.body
        },
        data: command.data
      };

      const ketQua = await messaging.sendEachForMulticast(message);
      successCount += ketQua.successCount;
      failureCount += ketQua.failureCount;

      ketQua.responses.forEach((phanHoi, index) => {
        if (!phanHoi.success && laLoiTokenKhongHopLe(phanHoi.error?.code)) {
          invalidTokens.push(loTokens[index]);
        }
      });
    }

    return {
      configured: true,
      successCount,
      failureCount,
      invalidTokens
    };
  }
}
