import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getUserAuthConfig } from "@/lib/user-auth/config";
import { getUserSession } from "@/lib/user-auth/session";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { sessionSecret } = getUserAuthConfig();
    const session = await getUserSession(sessionSecret);

    if (!session) {
      throw new ApiError("UNAUTHORIZED", "请先登录", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new ApiError("UNAUTHORIZED", "用户不存在或已禁用", 401);
    }

    // Get stats
    const [totalUsers, totalNews, publishedNews, draftNews] = await Promise.all([
      prisma.user.count({
        where: { deletedAt: null },
      }),
      prisma.news.count({
        where: { deletedAt: null },
      }),
      prisma.news.count({
        where: { deletedAt: null, status: "PUBLISHED" },
      }),
      prisma.news.count({
        where: { deletedAt: null, status: "DRAFT" },
      }),
    ]);

    return ok({
      totalUsers,
      totalNews,
      publishedNews,
      draftNews,
    });
  } catch (error) {
    return fail(error);
  }
}
