import { adminCookieName } from "@/lib/admin-auth/config";
import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { fail, ok } from "@/lib/api/response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOriginRequest(request);
    const response = ok({ authenticated: false });
    response.cookies.set(adminCookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return fail(error);
  }
}
