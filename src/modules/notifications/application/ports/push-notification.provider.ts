export type LenhGuiThongBaoDay = {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
};

export type KetQuaGuiThongBaoDay = {
  configured: boolean;
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
};

export interface DichVuGuiThongBaoDay {
  guiDenTokens(command: LenhGuiThongBaoDay): Promise<KetQuaGuiThongBaoDay>;
}
