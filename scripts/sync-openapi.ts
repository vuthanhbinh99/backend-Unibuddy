import { batDauDongBoOpenApi, dongBoOpenApi } from "../src/shared/openapi/openapi-sync.js";

const dangWatch = process.argv.includes("--watch");

if (dangWatch) {
  batDauDongBoOpenApi();
} else {
  await dongBoOpenApi();
}
