import { ApplicationCaseLocale } from "@prisma/client";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { clearCacheByNamespace } from "@/lib/cache";

export const runtime = "nodejs";

/**
 * 恢复已删除的应用案例
 *
 * POST /api/admin/application-cases/[id]/restore
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminActor();

    assertSameOriginRequest(request);

    const { id } = await params;

    const applicationCase =
      await prisma.applicationCase.findUnique({
        where: { id },
        select: {
          id: true,
          locale: true,
          slug: true,
          deletedAt: true,
        },
      });

    if (!applicationCase) {
      throw new ApiError(
        "NOT_FOUND",
        "应用案例不存在",
        404,
      );
    }

    if (!applicationCase.deletedAt) {
      throw new ApiError(
        "BAD_REQUEST",
        "应用案例未被删除",
        400,
      );
    }

    const conflict =
      await prisma.applicationCase.findFirst({
        where: {
          locale:
            applicationCase.locale as ApplicationCaseLocale,
          slug: applicationCase.slug,
          deletedAt: null,
        },
      });

    if (conflict) {
      throw new ApiError(
        "SLUG_ALREADY_EXISTS",
        "同语言下已存在相同的 Slug，无法恢复",
        409,
      );
    }

    const restored =
      await prisma.applicationCase.update({
        where: { id },
        data: { deletedAt: null },
        select: {
          id: true,
          locale: true,
          title: true,
          slug: true,
          caseDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    clearCacheByNamespace("application-cases");

    return ok(restored);
  } catch (error) {
    return fail(error);
  }
}
