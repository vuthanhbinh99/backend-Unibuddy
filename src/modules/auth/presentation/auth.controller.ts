import type { Request, Response } from "express";
import { z } from "zod";
import type { AppContainer } from "../../../container.js";
import { asyncHandler } from "../../../shared/http/async-handler.js";
import { created, ok } from "../../../shared/http/api-response.js";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    fcmToken: z.string().min(1).optional(),
    deviceType: z.string().min(1).optional()
  })
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(1),
    fcmToken: z.string().min(1).optional(),
    deviceType: z.string().min(1).optional()
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
    fcmToken: z.string().min(1).optional(),
    deviceType: z.string().min(1).optional()
  })
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1)
  })
});

type LoginBody = z.infer<typeof loginSchema>["body"];
type GoogleLoginBody = z.infer<typeof googleLoginSchema>["body"];
type RefreshTokenBody = z.infer<typeof refreshTokenSchema>["body"];
type LogoutBody = z.infer<typeof logoutSchema>["body"];

export class AuthController {
  constructor(private readonly container: AppContainer) {}

  login = asyncHandler(async (req: Request, res: Response) => {
    const body = (req.validated as { body: LoginBody }).body;

    const result = await this.container.loginUseCase.execute({
      email: body.email,
      password: body.password,
      device: {
        fcmToken: body.fcmToken ?? null,
        deviceType: body.deviceType ?? null,
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? null
      }
    });

    res.status(200).json(ok(result));
  });

  loginWithGoogle = asyncHandler(async (req: Request, res: Response) => {
    const body = (req.validated as { body: GoogleLoginBody }).body;

    const result = await this.container.googleLoginUseCase.execute({
      idToken: body.idToken,
      device: {
        fcmToken: body.fcmToken ?? null,
        deviceType: body.deviceType ?? null,
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? null
      }
    });

    res.status(200).json(ok(result));
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const body = (req.validated as { body: RefreshTokenBody }).body;

    const result = await this.container.refreshTokenUseCase.execute({
      refreshToken: body.refreshToken,
      device: {
        fcmToken: body.fcmToken ?? null,
        deviceType: body.deviceType ?? null,
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? null
      }
    });

    res.status(201).json(created(result));
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const body = (req.validated as { body: LogoutBody }).body;

    await this.container.logoutUseCase.execute({
      refreshToken: body.refreshToken,
      actorId: req.user?.id ?? null
    });

    res.status(200).json(ok({ loggedOut: true }));
  });
}
