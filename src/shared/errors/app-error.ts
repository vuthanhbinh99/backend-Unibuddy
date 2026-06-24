import { CacLoi, type MaLoi } from "./error-codes.js";

export class LoiUngDung extends Error {
  constructor(
    public readonly maTrangThai: number,
    public readonly maLoi: MaLoi,
    message: string,
    public readonly chiTiet?: unknown
  ) {
    super(message);
    this.name = "LoiUngDung";
  }

  static yeuCauSai(message: string, chiTiet?: unknown) {
    return new LoiUngDung(400, CacLoi.VALIDATION_ERROR, message, chiTiet);
  }

  static khongDuocXacThuc(message = "Unauthorized") {
    return new LoiUngDung(401, CacLoi.UNAUTHORIZED, message);
  }

  static khongCoQuyen(message = "Forbidden") {
    return new LoiUngDung(403, CacLoi.FORBIDDEN, message);
  }

  static khongTimThay(message = "Resource not found") {
    return new LoiUngDung(404, CacLoi.NOT_FOUND, message);
  }

  static xungDot(message: string, chiTiet?: unknown) {
    return new LoiUngDung(409, CacLoi.CONFLICT, message, chiTiet);
  }

  static khongTheXuLy(message: string, chiTiet?: unknown) {
    return new LoiUngDung(422, CacLoi.UNPROCESSABLE_ENTITY, message, chiTiet);
  }

  static biKhoa(message = "Account is locked") {
    return new LoiUngDung(423, CacLoi.ACCOUNT_LOCKED, message);
  }
}



