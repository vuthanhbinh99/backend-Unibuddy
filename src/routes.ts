import { Router } from "express";
import { buildContainer } from "./container.js";
import { buildAuthRoutes } from "./modules/auth/presentation/auth.routes.js";
import { buildHealthRoutes } from "./modules/health/health.routes.js";
import { buildUserRoutes } from "./modules/users/presentation/user.routes.js";

export const buildRoutes = () => {
  const router = Router();
  const container = buildContainer();

  router.use("/health", buildHealthRoutes(container));
  router.use("/auth", buildAuthRoutes(container));
  router.use("/users", buildUserRoutes(container));

  return router;
};
