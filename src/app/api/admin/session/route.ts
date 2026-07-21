import { ok } from "@/lib/api/response";
import { getAdminSession } from "@/lib/admin-auth/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  return ok({ authenticated: Boolean(session) });
}
