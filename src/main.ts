import { createApp } from "./app.js";
import { config } from "./shared/config/env.js";
import { logger } from "./shared/logger/logger.js";

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`UniBuddy API listening on port ${config.port}`);
});

const shutdown = (signal: string) => {
  logger.info(`${signal} received. Shutting down HTTP server...`);
  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
