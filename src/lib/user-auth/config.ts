import { ApiError } from "@/lib/api/errors";

export function getUserAuthConfig() {
  const sessionSecret = process.env.USER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  const ttlSeconds = Number(process.env.USER_SESSION_TTL_SECONDS ?? "28800");

  if (!sessionSecret || sessionSecret.length < 32) {
    throw new ApiError("INTERNAL_SERVER_ERROR", "用户认证尚未正确配置", 500);
  }

  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new ApiError("INTERNAL_SERVER_ERROR", "用户会话配置不正确", 500);
  }

  return {
    sessionSecret,
    ttlSeconds,
  };
}

export function getAppOrigins() {
  const configured = process.env.APP_ORIGIN;
  const origins = new Set(["http://localhost:3000"]);

  if (configured) {
    for (const item of configured.split(",")) {
      const value = item.trim();
      if (value) {
        origins.add(value);
      }
    }
  }

  return origins;
}
