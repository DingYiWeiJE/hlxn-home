import { ApiError } from "@/lib/api/errors";

export const adminCookieName = "hanly_admin_session";

export function getAdminConfig() {
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  const ttlSeconds = Number(process.env.ADMIN_SESSION_TTL_SECONDS ?? "28800");

  if (!passwordHash || !sessionSecret || sessionSecret.length < 32) {
    throw new ApiError("INTERNAL_SERVER_ERROR", "管理员认证尚未正确配置", 500);
  }

  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new ApiError("INTERNAL_SERVER_ERROR", "管理员会话配置不正确", 500);
  }

  return {
    passwordHash,
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
