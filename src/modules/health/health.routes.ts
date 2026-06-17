import { Router } from "express";
import type { AppContainer } from "../../container.js";
import { HealthController } from "./health.controller.js";

export const buildHealthRoutes = (container: AppContainer) => {
  const router = Router();
  const controller = new HealthController(container);

  router.get("/", controller.show);

  return router;
};
