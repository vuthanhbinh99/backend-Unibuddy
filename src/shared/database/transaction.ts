import type { CoSoDuLieu, BoThucThiTruyVan } from "./database.js";

export interface BoQuanLyGiaoDich {
  thucThiTrongGiaoDich<T>(hamXuLy: (boThucThi: BoThucThiTruyVan) => Promise<T>): Promise<T>;
}

export class BoQuanLyGiaoDichPostgres implements BoQuanLyGiaoDich {
  constructor(private readonly coSoDuLieu: CoSoDuLieu) {}

  async thucThiTrongGiaoDich<T>(hamXuLy: (boThucThi: BoThucThiTruyVan) => Promise<T>) {
    const ketNoi = await this.coSoDuLieu.ketNoi();
    const boThucThi: BoThucThiTruyVan = {
      truyVan: (text, params) => ketNoi.query(text, params as unknown[])
    };

    try {
      await ketNoi.query("BEGIN");
      const ketQua = await hamXuLy(boThucThi);
      await ketNoi.query("COMMIT");
      return ketQua;
    } catch (error) {
      await ketNoi.query("ROLLBACK");
      throw error;
    } finally {
      ketNoi.release();
    }
  }
}
