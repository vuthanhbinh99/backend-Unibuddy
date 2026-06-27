import { LoiUngDung } from "../../../shared/errors/app-error.js";
import type {
  BoKiemTraDanhTinhGoogle,
  DanhTinhGoogleDaXacMinh
} from "../application/ports/google-identity-verifier.js";

type PhanHoiThongTinGoogle = {
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
  aud?: string;
};

export class BoKiemTraDanhTinhGoogleQuaAPI implements BoKiemTraDanhTinhGoogle {
  constructor(private readonly cacMaKhachDuocPhep: readonly string[]) {}

  async xacThucIdToken(idToken: string): Promise<DanhTinhGoogleDaXacMinh> {
    try {
      const phanHoi = await fetch(
  `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
);

if (!phanHoi.ok) {
  const text = await phanHoi.text();
  console.error("Google tokeninfo failed:", {
    status: phanHoi.status,
    body: text
  });

  throw LoiUngDung.khongDuocXacThuc("Thẻ Google không hợp lệ");
}

const duLieu = (await phanHoi.json()) as PhanHoiThongTinGoogle;

console.log("Google token info:", {
  sub: duLieu.sub,
  email: duLieu.email,
  email_verified: duLieu.email_verified,
  aud: duLieu.aud,
  allowedAudiences: this.cacMaKhachDuocPhep
});

      if (!duLieu.sub || !duLieu.email) {
        throw LoiUngDung.khongDuocXacThuc("Thẻ Google không hợp lệ");
      }

      const emailDaXacThuc =
        duLieu.email_verified === true || duLieu.email_verified === "true";

      if (!emailDaXacThuc) {
        throw LoiUngDung.khongDuocXacThuc("Email Google chưa được xác thực");
      }

      if (
        this.cacMaKhachDuocPhep.length > 0 &&
        (!duLieu.aud || !this.cacMaKhachDuocPhep.includes(duLieu.aud))
      ) {
        throw LoiUngDung.khongDuocXacThuc("Thẻ Google không hợp lệ");
      }

      return {
        subject: duLieu.sub,
        email: duLieu.email,
        emailDaXacThuc,
        fullName: duLieu.name ?? null,
        avatarUrl: duLieu.picture ?? null,
        audience: duLieu.aud ?? null
      };
    } catch (error) {
      if (error instanceof LoiUngDung) {
        throw error;
      }

      throw LoiUngDung.khongDuocXacThuc("Không thể xác minh mã thông báo Google");
    }
  }
}



