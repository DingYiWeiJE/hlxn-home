import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { getAdminConfig, adminCookieName } from "@/lib/admin-auth/config";
import { verifyAdminPassword } from "@/lib/admin-auth/password";
import { createAdminSessionToken, getAdminCookieOptions } from "@/lib/admin-auth/session";
import { clearLoginFailures, getClientIp, isLoginRateLimited, recordLoginFailure } from "@/lib/admin-auth/rate-limit";
import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";

export const runtime = "nodejs";

const loginSchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOriginRequest(request);
    const ip = getClientIp(request);
    if (isLoginRateLimited(ip)) {
      throw new ApiError("RATE_LIMITED", "尝试次数过多，请稍后再试", 429);
    }

    const body = loginSchema.parse(await request.json());
    const { passwordHash } = getAdminConfig();
    const valid = await verifyAdminPassword(body.password, passwordHash);
    if (!valid) {
      recordLoginFailure(ip);
      throw new ApiError("UNAUTHORIZED", "密码不正确", 401);
    }

    clearLoginFailures(ip);
    const response = ok({ authenticated: true });
    response.cookies.set(adminCookieName, createAdminSessionToken(), getAdminCookieOptions());
    return response;
  } catch (error) {
    return fail(error);
  }
}
