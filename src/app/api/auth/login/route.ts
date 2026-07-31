import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getUserAuthConfig } from "@/lib/user-auth/config";
import { verifyPassword } from "@/lib/user-auth/password";
import { createUserSessionToken, getUserCookieOptions, userCookieName } from "@/lib/user-auth/session";
import { clearLoginFailures, getClientIp, isLoginRateLimited, recordLoginFailure } from "@/lib/user-auth/rate-limit";
import { assertSameOriginRequest } from "@/lib/user-auth/csrf";

export const runtime = "nodejs";

const loginSchema = z.object({
  username: z.string().min(1),
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
    const { sessionSecret, ttlSeconds } = getUserAuthConfig();
    const response = ok({ authenticated: true });

    const user = await prisma.user.findUnique({
      where: { username: body.username },
    });

    if (!user || !user.isActive || user.deletedAt) {
      recordLoginFailure(ip);
      throw new ApiError("UNAUTHORIZED", "用户名或密码不正确", 401);
    }

    const passwordValid = await verifyPassword(body.password, user.password);
    if (!passwordValid) {
      recordLoginFailure(ip);
      throw new ApiError("UNAUTHORIZED", "用户名或密码不正确", 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    clearLoginFailures(ip);
    const token = createUserSessionToken(user.id, user.username, user.role, sessionSecret, ttlSeconds);
    response.cookies.set(userCookieName, token, getUserCookieOptions(ttlSeconds));
    return response;
  } catch (error) {
    return fail(error);
  }
}
