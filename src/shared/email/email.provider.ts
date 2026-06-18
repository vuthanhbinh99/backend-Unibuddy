export type DuLieuGuiEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export interface DichVuGuiEmail {
  gui(noiDung: DuLieuGuiEmail): Promise<void>;
}