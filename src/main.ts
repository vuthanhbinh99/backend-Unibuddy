import { taoUngDung } from "./app.js";
import { cauHinh } from "./shared/config/env.js";
import { nhatKy } from "./shared/logger/logger.js";

const ungDung = taoUngDung();

const mayChu = ungDung.listen(cauHinh.port, () => {
  nhatKy.info(`UniBuddy API listening on port ${cauHinh.port}`);
});

const shutdown = (tinHieu: string) => {
  nhatKy.info(`${tinHieu} received. Shutting down HTTP mayChu...`);
  mayChu.close(() => {
    nhatKy.info("HTTP mayChu closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));



