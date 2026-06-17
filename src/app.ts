import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { buildRoutes } from "./routes.js";
import { config } from "./shared/config/env.js";
import { errorHandler } from "./shared/middleware/error-handler.js";
import { notFoundHandler } from "./shared/middleware/not-found-handler.js";
import { requestContext } from "./shared/middleware/request-context.js";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(compression());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
  app.use(requestContext);

  app.use("/api/v1", buildRoutes());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
