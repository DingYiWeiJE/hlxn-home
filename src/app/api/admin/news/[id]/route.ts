import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth/require-admin";
import { getUserAuthConfig } from "@/lib/user-auth/config";
import { getUserSession } from "@/lib/user-auth/session";

export const runtime = "nodejs";

async function checkAuth() {
  try {
    const { sessionSecret } = getUserAuthConfig();
    const session = await getUserSession(sessionSecret);
    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.sub },
      });
      if (user && user.isActive && !user.deletedAt) {
        return user;
      }
    }
  } catch {
    // Fall back to admin auth
  }

  const adminSession = await requireAdmin();
  if (adminSession) {
    return true;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await checkAuth();
    const { id } = await params;
    const news = await prisma.news.findUnique({ where: { id } });
    if (!news) {
      const error = new Error("新闻不存在") as Error & { status?: number };
      error.status = 404;
      throw error;
    }
    return ok(news);
  } catch (error) {
    return fail(error);
  }
}
