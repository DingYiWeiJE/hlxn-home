import { adminCookieName } from "@/lib/admin-auth/config";
import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { fail, ok } from "@/lib/api/response";
import { shouldUseSecureCookies } from "@/lib/auth-cookie";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOriginRequest(request);
    const response = ok({ authenticated: false });
    response.cookies.set(adminCookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookies(),
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return fail(error);
  }
}
