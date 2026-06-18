import type { PoolClient, QueryResult, QueryResultRow } from "pg";

export type ThamSoTruyVan = readonly unknown[];

export interface BoThucThiTruyVan {
  truyVan<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: ThamSoTruyVan
  ): Promise<QueryResult<T>>;
}

export interface CoSoDuLieu extends BoThucThiTruyVan {
  ketNoi(): Promise<PoolClient>;
  dong(): Promise<void>;
}



