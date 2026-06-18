import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: z.string().default("*"),
  GOOGLE_CLIENT_IDS: z.string().default(""),
  DEFAULT_STUDENT_ROLE_CODE: z.string().default("SINH_VIEN"),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),
  SMTP_FROM_EMAIL: z.string().default(""),
  SMTP_FROM_NAME: z.string().default("UniBuddy")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables", parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

const corsOrigins =
  parsedEnv.data.CORS_ORIGINS === "*"
    ? "*"
    : parsedEnv.data.CORS_ORIGINS.split(",").map((origin) => origin.trim());

const googleClientIds = parsedEnv.data.GOOGLE_CLIENT_IDS.split(",")
  .map((clientId) => clientId.trim())
  .filter(Boolean);

export const cauHinh = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  database: {
    url: parsedEnv.data.DATABASE_URL,
    ssl: parsedEnv.data.DATABASE_SSL
  },
  jwt: {
    accessSecret: parsedEnv.data.JWT_ACCESS_SECRET,
    accessExpiresIn: parsedEnv.data.JWT_ACCESS_EXPIRES_IN,
    refreshTokenExpiresDays: parsedEnv.data.REFRESH_TOKEN_EXPIRES_DAYS
  },
  auth: {
    googleClientIds,
    maCodeVaiTroSinhVienMacDinh: parsedEnv.data.DEFAULT_STUDENT_ROLE_CODE
  },
  email: {
    smtp: {
      host: parsedEnv.data.SMTP_HOST,
      port: parsedEnv.data.SMTP_PORT,
      secure: parsedEnv.data.SMTP_SECURE,
      user: parsedEnv.data.SMTP_USER || null,
      password: parsedEnv.data.SMTP_PASSWORD || null,
      fromEmail: parsedEnv.data.SMTP_FROM_EMAIL || null,
      fromName: parsedEnv.data.SMTP_FROM_NAME
    }
  },
  corsOrigins
} as const;



