import { ErrorCodes, type ErrorCode } from "./error-codes.js";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, ErrorCodes.VALIDATION_ERROR, message, details);
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(401, ErrorCodes.UNAUTHORIZED, message);
  }

  static forbidden(message = "Forbidden") {
    return new AppError(403, ErrorCodes.FORBIDDEN, message);
  }

  static notFound(message = "Resource not found") {
    return new AppError(404, ErrorCodes.NOT_FOUND, message);
  }

  static conflict(message: string, details?: unknown) {
    return new AppError(409, ErrorCodes.CONFLICT, message, details);
  }

  static locked(message = "Account is locked") {
    return new AppError(423, ErrorCodes.ACCOUNT_LOCKED, message);
  }
}
