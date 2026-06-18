import nodemailer, { type Transporter } from "nodemailer";
import type { DichVuGuiEmail, DuLieuGuiEmail } from "./email.provider.js";

export type CauHinhGuiEmailSMTP = {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  password: string | null;
  fromEmail: string | null;
  fromName: string;
};

export class DichVuGuiEmailSmtp implements DichVuGuiEmail {
  private readonly transporter: Transporter | null;

  constructor(private readonly cauHinh: CauHinhGuiEmailSMTP) {
    this.transporter = cauHinh.host
      ? nodemailer.createTransport({
          host: cauHinh.host,
          port: cauHinh.port,
          secure: cauHinh.secure,
          auth:
            cauHinh.user && cauHinh.password
              ? {
                  user: cauHinh.user,
                  pass: cauHinh.password
                }
              : undefined
        })
      : null;
  }

  async gui(noiDung: DuLieuGuiEmail) {
    if (!this.transporter || !this.cauHinh.fromEmail) {
      throw new Error("SMTP email service is not configured");
    }

    await this.transporter.sendMail({
      from: `"${this.cauHinh.fromName}" <${this.cauHinh.fromEmail}>`,
      to: noiDung.to,
      subject: noiDung.subject,
      text: noiDung.text,
      html: noiDung.html
    });
  }
}