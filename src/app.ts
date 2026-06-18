import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { xayDungTuyenDuong } from "./routes.js";
import { cauHinh } from "./shared/config/env.js";
import { xuLyLoi } from "./shared/middleware/error-handler.js";
import { xuLyKhongTimThay } from "./shared/middleware/not-found-handler.js";
import { taoBoiCanhYeuCau } from "./shared/middleware/request-context.js";

export const taoUngDung = () => {
  const ungDung = express();

  ungDung.disable("x-powered-by");
  ungDung.use(helmet());
  ungDung.use(compression());
  ungDung.use(cors({ origin: cauHinh.corsOrigins }));
  ungDung.use(express.json({ limit: "2mb" }));
  ungDung.use(express.urlencoded({ extended: true }));
  ungDung.use(morgan(cauHinh.nodeEnv === "production" ? "combined" : "dev"));
  ungDung.use(taoBoiCanhYeuCau);

  ungDung.use("/api/v1", xayDungTuyenDuong());

  ungDung.use(xuLyKhongTimThay);
  ungDung.use(xuLyLoi);

  return ungDung;
};



