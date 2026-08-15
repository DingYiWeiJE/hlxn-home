import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { prisma } from "@/lib/prisma";
import { clearCacheByNamespace } from "@/lib/cache/helpers";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(
  request: Request,
  { params }: Params,
) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { id } = await params;

    const existing = await prisma.news.findUnique({
      where: { id },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (!existing) {
      throw new ApiError(
        "NEWS_NOT_FOUND",
        "新闻不存在",
        404,
      );
    }

    if (!existing.deletedAt) {
      throw new ApiError(
        "BAD_REQUEST",
        "只能永久删除已删除的新闻",
        400,
      );
    }

    await prisma.news.delete({
      where: { id },
    });

    clearCacheByNamespace("news");

    return ok({ id });
  } catch (error) {
    return fail(error);
  }
}
