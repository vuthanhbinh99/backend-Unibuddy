import pg from "pg";
import { config } from "../config/env.js";
import type { Database, QueryParams } from "./database.js";

export class PostgresConnectionPool implements Database {
  private readonly pool: pg.Pool;

  constructor() {
    this.pool = new pg.Pool({
      connectionString: config.database.url,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false
    });
  }

  query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: QueryParams) {
    return this.pool.query<T>(text, params as unknown[]);
  }

  connect() {
    return this.pool.connect();
  }

  async close() {
    await this.pool.end();
  }
}
