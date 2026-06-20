import type {
  DuLieuLuuMaQuenMatKhauTam,
  DuLieuLuuTokenDatLaiMatKhauTam,
  KhoTamDatLaiMatKhau,
  TrangThaiQuenMatKhauTam
} from "../application/ports/forgot-password-cache.js";

const chuanHoaEmail = (email: string) => email.trim().toLowerCase();

export class KhoTamDatLaiMatKhauTrongBoNho implements KhoTamDatLaiMatKhau {
  private readonly theoEmail = new Map<string, TrangThaiQuenMatKhauTam>();
  private readonly emailTheoResetTokenHash = new Map<string, string>();

  luuMa(data: DuLieuLuuMaQuenMatKhauTam) {
    const email = chuanHoaEmail(data.email);
    this.xoaTheoEmail(email);

    this.theoEmail.set(email, {
      userId: data.userId,
      email,
      codeHash: data.codeHash,
      codeExpiresAt: data.expiresAt,
      failedAttempts: 0,
      resetTokenHash: null,
      resetTokenExpiresAt: null
    });
  }

  timTheoEmail(email: string) {
    const emailDaChuanHoa = chuanHoaEmail(email);
    const trangThai = this.theoEmail.get(emailDaChuanHoa) ?? null;

    if (trangThai && this.daHetHanHoanToan(trangThai)) {
      this.xoaTheoEmail(emailDaChuanHoa);
      return null;
    }

    return trangThai;
  }

  tangSoLanNhapSai(email: string) {
    const emailDaChuanHoa = chuanHoaEmail(email);
    const trangThai = this.timTheoEmail(emailDaChuanHoa);

    if (!trangThai) {
      return null;
    }

    const capNhat = {
      ...trangThai,
      failedAttempts: trangThai.failedAttempts + 1
    };

    this.theoEmail.set(emailDaChuanHoa, capNhat);
    return capNhat;
  }

  luuToken(data: DuLieuLuuTokenDatLaiMatKhauTam) {
    const email = chuanHoaEmail(data.email);
    const trangThai = this.timTheoEmail(email);

    if (!trangThai) {
      return;
    }

    if (trangThai.resetTokenHash) {
      this.emailTheoResetTokenHash.delete(trangThai.resetTokenHash);
    }

    const capNhat = {
      ...trangThai,
      codeExpiresAt: new Date(0),
      resetTokenHash: data.resetTokenHash,
      resetTokenExpiresAt: data.expiresAt
    };

    this.theoEmail.set(email, capNhat);
    this.emailTheoResetTokenHash.set(data.resetTokenHash, email);
  }

  timTheoToken(resetTokenHash: string) {
    const email = this.emailTheoResetTokenHash.get(resetTokenHash);

    if (!email) {
      return null;
    }

    const trangThai = this.timTheoEmail(email);

    if (!trangThai || trangThai.resetTokenHash !== resetTokenHash) {
      this.emailTheoResetTokenHash.delete(resetTokenHash);
      return null;
    }

    return trangThai;
  }

  xoaTheoEmail(email: string) {
    const emailDaChuanHoa = chuanHoaEmail(email);
    const trangThai = this.theoEmail.get(emailDaChuanHoa);

    if (trangThai?.resetTokenHash) {
      this.emailTheoResetTokenHash.delete(trangThai.resetTokenHash);
    }

    this.theoEmail.delete(emailDaChuanHoa);
  }

  private daHetHanHoanToan(trangThai: TrangThaiQuenMatKhauTam) {
    const now = Date.now();
    const codeDaHetHan = trangThai.codeExpiresAt.getTime() <= now;
    const tokenDaHetHan =
      !trangThai.resetTokenExpiresAt || trangThai.resetTokenExpiresAt.getTime() <= now;

    return codeDaHetHan && tokenDaHetHan;
  }
}
