import { taoUngDung } from "./app.js";
import { xayDungBoPhuThuoc } from "./container.js";
import { batDauQuetNhacNhoDeadline } from "./modules/deadlines/application/services/deadline-reminder-scheduler.js";
import { cauHinh } from "./shared/config/env.js";
import { nhatKy } from "./shared/logger/logger.js";
import { batDauDongBoOpenApi } from "./shared/openapi/openapi-sync.js";

const ungDung = taoUngDung();

if (cauHinh.nodeEnv !== "production") {
  batDauDongBoOpenApi();
}

const dungQuetNhacNho = batDauQuetNhacNhoDeadline(
  xayDungBoPhuThuoc().dichVuQuetNhacNhoDeadline
);

const mayChu = ungDung.listen(cauHinh.port, () => {
  nhatKy.info(`UniBuddy API listening on port ${cauHinh.port}`);
});

const shutdown = (tinHieu: string) => {
  nhatKy.info(`${tinHieu} received. Shutting down HTTP mayChu...`);
  dungQuetNhacNho();
  mayChu.close(() => {
    nhatKy.info("HTTP mayChu closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));



