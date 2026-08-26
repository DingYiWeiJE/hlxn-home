import { SolutionLocale } from "@prisma/client";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { clearCacheByNamespace } from "@/lib/cache";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = await requireAdminActor();
    assertSameOriginRequest(request);

    const { id } = await context.params;

    const solution = await prisma.solution.findFirst({
      where: {
        id,
        deletedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        locale: true,
        slug: true,
        translationKey: true,
      },
    });

    if (!solution) {
      throw new ApiError("NOT_FOUND", "Deleted solution not found", 404);
    }

    await ensureRestoreAvailable(solution);

    const restored = await prisma.solution.update({
      where: {
        id,
      },
      data: {
        deletedAt: null,
        updatedBy: actor.userId,
      },
      select: {
        id: true,
        locale: true,
        slug: true,
        title: true,
        subtitle: true,
        deletedAt: true,
      },
    });

    clearCacheByNamespace("solutions");

    return ok({
      ...restored,
      restored: true,
    });
  } catch (error) {
    return fail(error);
  }
}

async function ensureRestoreAvailable(solution: {
  id: string;
  locale: SolutionLocale;
  slug: string;
  translationKey: string | null;
}) {
  const slugConflict = await prisma.solution.findFirst({
    where: {
      id: {
        not: solution.id,
      },
      locale: solution.locale,
      slug: solution.slug,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (slugConflict) {
    throw new ApiError(
      "SLUG_ALREADY_EXISTS",
      "Another active solution already uses this slug",
      409,
      {
        slug: ["Another active solution already uses this slug"],
      },
    );
  }

  if (!solution.translationKey) {
    return;
  }

  const translationConflict = await prisma.solution.findFirst({
    where: {
      id: {
        not: solution.id,
      },
      locale: solution.locale,
      translationKey: solution.translationKey,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (translationConflict) {
    throw new ApiError(
      "BAD_REQUEST",
      "Another active solution already uses this translation key in the same locale",
      409,
      {
        translationKey: [
          "Another active solution already uses this translation key in the same locale",
        ],
      },
    );
  }
}
