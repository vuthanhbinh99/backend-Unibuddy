import type { PoolClient, QueryResult, QueryResultRow } from "pg";

export type QueryParams = readonly unknown[];

export interface QueryExecutor {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: QueryParams
  ): Promise<QueryResult<T>>;
}

export interface Database extends QueryExecutor {
  connect(): Promise<PoolClient>;
  close(): Promise<void>;
}
