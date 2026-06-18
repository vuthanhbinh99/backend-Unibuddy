import type { NguoiDungXacThuc } from "../../modules/auth/domain/auth-token-payload.js";

declare global {
  namespace Express {
    interface Request {
      maYeuCau?: string;
      user?: NguoiDungXacThuc;
      duLieuDaXacThuc?: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
    }
  }
}

export {};
