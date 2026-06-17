export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  INTERNAL_ERROR: "INTERNAL_ERROR"
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
