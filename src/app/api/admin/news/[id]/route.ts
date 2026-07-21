import { requireAdmin } from "@/lib/admin-auth/require-admin";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const news = await prisma.news.findUnique({ where: { id } });
    if (!news) {
      const error = new Error("新闻不存在");
      (error as any).status = 404;
      throw error;
    }
    return ok(news);
  } catch (error) {
    return fail(error);
  }
}
