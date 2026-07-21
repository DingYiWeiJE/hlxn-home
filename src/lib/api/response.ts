import { NextResponse } from "next/server";
import { toApiError } from "./errors";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors: Record<string, string[]>;
  };
};

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(error: unknown): NextResponse<ApiFailure> {
  const apiError = toApiError(error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: apiError.code,
        message: apiError.message,
        fieldErrors: apiError.fieldErrors,
      },
    },
    { status: apiError.status },
  );
}
