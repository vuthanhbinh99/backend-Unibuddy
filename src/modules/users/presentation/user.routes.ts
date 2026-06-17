import { Router } from "express";
import type { AppContainer } from "../../../container.js";
import { AuthMiddleware } from "../../auth/presentation/auth.middleware.js";
import { UserController } from "./user.controller.js";

export const buildUserRoutes = (container: AppContainer) => {
  const router = Router();
  const controller = new UserController(container);
  const auth = new AuthMiddleware(container);

  router.get("/me", auth.requireAuth, controller.me);

  return router;
};
