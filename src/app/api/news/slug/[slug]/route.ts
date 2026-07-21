import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { findPublishedNewsBySlug } from "@/lib/news/queries";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const news = await findPublishedNewsBySlug(slug);
    if (!news) {
      throw new ApiError("NEWS_NOT_FOUND", "新闻不存在", 404);
    }

    const where = {
      status: "PUBLISHED" as const,
      deletedAt: null,
      publishedAt: { lte: new Date() },
    };
    const [previous, next] = await Promise.all([
      prisma.news.findFirst({
        where: { ...where, publishedAt: { lt: news.publishedAt ?? news.createdAt } },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        select: { title: true, slug: true },
      }),
      prisma.news.findFirst({
        where: { ...where, publishedAt: { gt: news.publishedAt ?? news.createdAt } },
        orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
        select: { title: true, slug: true },
      }),
    ]);

    return ok({ news, previous, next });
  } catch (error) {
    return fail(error);
  }
}
