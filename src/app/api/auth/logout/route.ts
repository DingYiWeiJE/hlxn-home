import { userCookieName } from "@/lib/user-auth/session";
import { assertSameOriginRequest } from "@/lib/user-auth/csrf";
import { fail, ok } from "@/lib/api/response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOriginRequest(request);
    const response = ok({ authenticated: false });
    response.cookies.set(userCookieName, "", {
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
