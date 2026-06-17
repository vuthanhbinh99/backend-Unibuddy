import type { Request, Response } from "express";
import type { AppContainer } from "../../../container.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { asyncHandler } from "../../../shared/http/async-handler.js";
import { ok } from "../../../shared/http/api-response.js";

export class UserController {
  constructor(private readonly container: AppContainer) {}

  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const user = await this.container.getCurrentUserUseCase.execute(req.user.id);
    res.status(200).json(ok(user));
  });
}
