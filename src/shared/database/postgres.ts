import pg from "pg";
import { cauHinh } from "../config/env.js";
import type { CoSoDuLieu, ThamSoTruyVan } from "./database.js";

export class KetNoiPostgres implements CoSoDuLieu {
  private readonly pool: pg.Pool;

  constructor() {
    this.pool = new pg.Pool({
      connectionString: cauHinh.database.url,
      ssl: cauHinh.database.ssl ? { rejectUnauthorized: false } : false
    });
  }

  truyVan<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: ThamSoTruyVan) {
    return this.pool.query<T>(text, params as unknown[]);
  }

  ketNoi() {
    return this.pool.connect();
  }

  async dong() {
    await this.pool.end();
  }
}



