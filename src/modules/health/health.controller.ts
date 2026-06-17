import type { Request, Response } from "express";
import type { AppContainer } from "../../container.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { ok } from "../../shared/http/api-response.js";

export class HealthController {
  constructor(private readonly container: AppContainer) {}

  show = asyncHandler(async (_req: Request, res: Response) => {
    await this.container.db.query("SELECT 1");

    res.status(200).json(
      ok({
        status: "ok",
        database: "reachable"
      })
    );
  });
}
