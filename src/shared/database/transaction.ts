import type { Database, QueryExecutor } from "./database.js";

export interface TransactionManager {
  withTransaction<T>(callback: (client: QueryExecutor) => Promise<T>): Promise<T>;
}

export class PostgresTransactionManager implements TransactionManager {
  constructor(private readonly db: Database) {}

  async withTransaction<T>(callback: (client: QueryExecutor) => Promise<T>) {
    const client = await this.db.connect();

    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
