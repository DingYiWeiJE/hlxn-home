import { ApiError } from "@/lib/api/errors";
import { getAppOrigins } from "./config";

export function assertSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowed = getAppOrigins();

  if (origin) {
    if (!allowed.has(origin)) {
      throw new ApiError("FORBIDDEN", "请求来源不被允许", 403);
    }
    return;
  }

  if (referer) {
    const refererOrigin = new URL(referer).origin;
    if (allowed.has(refererOrigin)) {
      return;
    }
  }

  throw new ApiError("FORBIDDEN", "请求来源不被允许", 403);
}
