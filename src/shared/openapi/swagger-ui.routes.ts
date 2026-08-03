import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";

const duongDanOpenApi = path.resolve(process.cwd(), "openapi.yaml");

export const xayDungTuyenDuongSwaggerUi = () => {
  const router = Router();

  router.get("/openapi.yaml", (_req, res) => {
    if (!fs.existsSync(duongDanOpenApi)) {
      res.status(404).type("text/plain").send("Chua tim thay file openapi.yaml. Hay chay npm run openapi:sync.");
      return;
    }

    res.type("application/yaml").sendFile(duongDanOpenApi);
  });

  router.use(
    "/",
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      customSiteTitle: "UniBuddy API Docs",
      swaggerOptions: {
        url: "/api-docs/openapi.yaml",
        persistAuthorization: true
      }
    })
  );

  return router;
};
