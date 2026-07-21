import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdmin } from "@/lib/admin-auth/require-admin";
import { prisma } from "@/lib/prisma";
import { revalidateNewsCache } from "@/lib/news/cache";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    assertSameOriginRequest(request);
    const { id } = await params;
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("NEWS_NOT_FOUND", "新闻不存在", 404);
    }
    const restored = await prisma.news.update({
      where: { id },
      data: { deletedAt: null },
    });
    revalidateNewsCache({ newSlug: restored.slug });
    return ok(restored);
  } catch (error) {
    return fail(error);
  }
}
