import { Router } from "express";
import type { AppContainer } from "../../../container.js";
import { validateRequest } from "../../../shared/validation/validate-request.js";
import {
  AuthController,
  googleLoginSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema
} from "./auth.controller.js";

export const buildAuthRoutes = (container: AppContainer) => {
  const router = Router();
  const controller = new AuthController(container);

  router.post("/login", validateRequest(loginSchema), controller.login);
  router.post("/google", validateRequest(googleLoginSchema), controller.loginWithGoogle);
  router.post("/refresh", validateRequest(refreshTokenSchema), controller.refresh);
  router.post("/logout", validateRequest(logoutSchema), controller.logout);

  return router;
};
