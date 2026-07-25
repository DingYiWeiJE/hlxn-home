import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";

export const userCookieName = "hanly_user_session";

type UserSessionPayload = {
  sub: string; // userId
  username: string;
  role: UserRole;
  exp: number;
  nonce: string;
};

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createUserSessionToken(userId: string, username: string, role: UserRole, sessionSecret: string, ttlSeconds: number) {
  const payload: UserSessionPayload = {
    sub: userId,
    username,
    role,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    nonce: randomBytes(16).toString("hex"),
  };
  const encoded = base64url(JSON.stringify(payload));
  const signature = sign(encoded, sessionSecret);

  return `${encoded}.${signature}`;
}

export function verifyUserSessionToken(token: string | undefined, sessionSecret: string) {
  if (!token) {
    return null;
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = sign(encoded, sessionSecret);
  if (!safeEqual(signature, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<UserSessionPayload>;
    if (typeof payload.sub !== "string" || typeof payload.username !== "string" || typeof payload.role !== "string") {
      return null;
    }
    if (typeof payload.exp !== "number") {
      return null;
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload as UserSessionPayload;
  } catch {
    return null;
  }
}

export async function getUserSession(sessionSecret: string) {
  const store = await cookies();
  return verifyUserSessionToken(store.get(userCookieName)?.value, sessionSecret);
}

export function getUserCookieOptions(ttlSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttlSeconds,
  };
}
