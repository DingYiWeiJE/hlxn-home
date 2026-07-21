import { ZodError } from "zod";

export const errorCodes = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "RATE_LIMITED",
  "NEWS_NOT_FOUND",
  "SLUG_ALREADY_EXISTS",
  "MEDIA_NOT_FOUND",
  "FILE_TOO_LARGE",
  "UNSUPPORTED_FILE_TYPE",
  "INVALID_IMAGE",
  "INVALID_MEDIA_PATH",
  "UPLOAD_FAILED",
  "INTERNAL_SERVER_ERROR",
] as const;

export type ApiErrorCode = (typeof errorCodes)[number];
export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status = 400,
    public readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
  }
}

export function validationError(error: ZodError): ApiError {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  return new ApiError("VALIDATION_ERROR", "请求参数不正确", 400, fieldErrors);
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof ZodError) {
    return validationError(error);
  }

  console.error("Unhandled API error", error);
  return new ApiError("INTERNAL_SERVER_ERROR", "服务器内部错误", 500);
}
