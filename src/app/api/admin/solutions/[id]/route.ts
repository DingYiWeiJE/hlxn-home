import { Prisma, SolutionLocale } from "@prisma/client";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { updateSolutionSchema } from "@/lib/solutions/schemas";
import { validateSolutionReferences } from "@/lib/solutions/validation";
import { clearCacheByNamespace } from "@/lib/cache";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const solutionDetailSelect = {
  id: true,
  locale: true,
  title: true,
  subtitle: true,
  slug: true,
  status: true,
  sortOrder: true,
  translationKey: true,
  summaryParagraphs: true,
  highlights: true,
  workingPrincipleParagraphs: true,
  workingPrincipleBackgroundAssetId: true,
  coverImageAssetId: true,
  systemCompositionParagraphs: true,
  createdBy: true,
  updatedBy: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  coverImageAsset: {
    select: {
      id: true,
      type: true,
      url: true,
      filename: true,
      originalName: true,
      mimeType: true,
      size: true,
      width: true,
      height: true,
      alt: true,
    },
  },
  workingPrincipleBackgroundAsset: {
    select: {
      id: true,
      type: true,
      url: true,
      filename: true,
      originalName: true,
      mimeType: true,
      size: true,
      width: true,
      height: true,
      alt: true,
    },
  },
  usageScenarios: {
    orderBy: {
      sortOrder: "asc" as const,
    },
    select: {
      id: true,
      title: true,
      detailParagraphs: true,
      sortOrder: true,
      imageAssetId: true,
      imageAsset: {
        select: {
          id: true,
          type: true,
          url: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          width: true,
          height: true,
          alt: true,
        },
      },
    },
  },
  customerValues: {
    orderBy: {
      sortOrder: "asc" as const,
    },
    select: {
      id: true,
      title: true,
      detailParagraphs: true,
      sortOrder: true,
      imageAssetId: true,
      imageAsset: {
        select: {
          id: true,
          type: true,
          url: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          width: true,
          height: true,
          alt: true,
        },
      },
    },
  },
} satisfies Prisma.SolutionSelect;

type SolutionDetailPayload = Prisma.SolutionGetPayload<{
  select: typeof solutionDetailSelect;
}>;

function formatSolutionDetail(solution: SolutionDetailPayload) {
  return {
    id: solution.id,
    locale: solution.locale,
    title: solution.title,
    subtitle: solution.subtitle,
    slug: solution.slug,
    status: solution.status,
    sortOrder: solution.sortOrder,
    translationKey: solution.translationKey,
    summaryParagraphs: solution.summaryParagraphs,
    highlights: solution.highlights,
    workingPrincipleParagraphs: solution.workingPrincipleParagraphs,
    workingPrincipleBackgroundAssetId:
      solution.workingPrincipleBackgroundAssetId,
    coverImageAssetId: solution.coverImageAssetId,
    coverImageAsset: solution.coverImageAsset,
    workingPrincipleBackgroundAsset:
      solution.workingPrincipleBackgroundAsset,
    systemCompositionParagraphs: solution.systemCompositionParagraphs,
    usageScenarios: solution.usageScenarios,
    customerValues: solution.customerValues,
    createdBy: solution.createdBy,
    updatedBy: solution.updatedBy,
    publishedAt: solution.publishedAt,
    createdAt: solution.createdAt,
    updatedAt: solution.updatedAt,
    deletedAt: solution.deletedAt,
    detailUrl: `/${solution.locale}/solutions/${solution.slug}`,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminActor();

    const { id } = await context.params;

    const solution = await prisma.solution.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: solutionDetailSelect,
    });

    if (!solution) {
      throw new ApiError("NOT_FOUND", "Solution not found", 404);
    }

    return ok(formatSolutionDetail(solution));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await requireAdminActor();
    assertSameOriginRequest(request);

    const { id } = await context.params;
    const body = updateSolutionSchema.parse(await request.json());

    const existing = await prisma.solution.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        locale: true,
        slug: true,
        status: true,
        publishedAt: true,
        translationKey: true,
      },
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", "Solution not found", 404);
    }

    await validateSolutionReferences({
      coverImageAssetId: body.coverImageAssetId,
      workingPrincipleBackgroundAssetId:
        body.workingPrincipleBackgroundAssetId,
      usageScenarios: body.usageScenarios,
      customerValues: body.customerValues,
    });

    const nextLocale =
      body.locale !== undefined
        ? (body.locale as SolutionLocale)
        : existing.locale;

    if (nextLocale !== existing.locale) {
      const slugExists = await prisma.solution.findFirst({
        where: {
          id: {
            not: id,
          },
          locale: nextLocale,
          slug: existing.slug,
        },
        select: {
          id: true,
          deletedAt: true,
        },
      });

      if (slugExists) {
        const message = slugExists.deletedAt
          ? "A deleted solution already uses this slug in the target locale"
          : "A solution already uses this slug in the target locale";

        throw new ApiError("SLUG_ALREADY_EXISTS", message, 409, {
          locale: [message],
        });
      }
    }

    if (body.translationKey !== undefined) {
      await ensureTranslationKeyAvailable({
        translationKey: body.translationKey,
        locale: nextLocale,
        excludeId: id,
      });
    } else if (nextLocale !== existing.locale && existing.translationKey) {
      await ensureTranslationKeyAvailable({
        translationKey: existing.translationKey,
        locale: nextLocale,
        excludeId: id,
      });
    }

    let publishedAt: Date | null | undefined;

    if (body.status === "PUBLISHED") {
      publishedAt = body.publishedAt ?? existing.publishedAt ?? new Date();
    }

    const solution = await prisma.$transaction(async (transaction) => {
      if (body.usageScenarios !== undefined) {
        await transaction.solutionUsageScenario.deleteMany({
          where: {
            solutionId: id,
          },
        });

        if (body.usageScenarios.length > 0) {
          await transaction.solutionUsageScenario.createMany({
            data: body.usageScenarios.map((item, index) => ({
              solutionId: id,
              title: item.title,
              detailParagraphs: item.detailParagraphs,
              imageAssetId: item.imageAssetId,
              sortOrder: item.sortOrder ?? index,
            })),
          });
        }
      }

      if (body.customerValues !== undefined) {
        await transaction.solutionCustomerValue.deleteMany({
          where: {
            solutionId: id,
          },
        });

        if (body.customerValues.length > 0) {
          await transaction.solutionCustomerValue.createMany({
            data: body.customerValues.map((item, index) => ({
              solutionId: id,
              title: item.title,
              detailParagraphs: item.detailParagraphs,
              imageAssetId: item.imageAssetId,
              sortOrder: item.sortOrder ?? index,
            })),
          });
        }
      }

      await transaction.solution.update({
        where: {
          id,
        },
        data: {
          ...(body.locale !== undefined ? { locale: nextLocale } : {}),
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.subtitle !== undefined ? { subtitle: body.subtitle } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.sortOrder !== undefined
            ? { sortOrder: body.sortOrder }
            : {}),
          ...(body.translationKey !== undefined
            ? { translationKey: body.translationKey }
            : {}),
          ...(body.coverImageAssetId !== undefined
            ? { coverImageAssetId: body.coverImageAssetId }
            : {}),
          ...(body.summaryParagraphs !== undefined
            ? { summaryParagraphs: body.summaryParagraphs }
            : {}),
          ...(body.highlights !== undefined ? { highlights: body.highlights } : {}),
          ...(body.workingPrincipleParagraphs !== undefined
            ? {
                workingPrincipleParagraphs:
                  body.workingPrincipleParagraphs,
              }
            : {}),
          ...(body.workingPrincipleBackgroundAssetId !== undefined
            ? {
                workingPrincipleBackgroundAssetId:
                  body.workingPrincipleBackgroundAssetId,
              }
            : {}),
          ...(body.systemCompositionParagraphs !== undefined
            ? {
                systemCompositionParagraphs:
                  body.systemCompositionParagraphs,
              }
            : {}),
          updatedBy: actor.userId,
          ...(publishedAt !== undefined ? { publishedAt } : {}),
        },
      });

      return transaction.solution.findUniqueOrThrow({
        where: {
          id,
        },
        select: solutionDetailSelect,
      });
    });

    clearCacheByNamespace("solutions");

    return ok(formatSolutionDetail(solution));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = await requireAdminActor();
    assertSameOriginRequest(request);

    const { id } = await context.params;

    const solution = await prisma.solution.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!solution) {
      throw new ApiError("NOT_FOUND", "Solution not found", 404);
    }

    await prisma.solution.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        updatedBy: actor.userId,
      },
    });

    clearCacheByNamespace("solutions");

    return ok({
      id,
      deleted: true,
    });
  } catch (error) {
    return fail(error);
  }
}

async function ensureTranslationKeyAvailable({
  translationKey,
  locale,
  excludeId,
}: {
  translationKey?: string | null;
  locale: SolutionLocale;
  excludeId?: string;
}) {
  if (!translationKey) {
    return;
  }

  const existing = await prisma.solution.findFirst({
    where: {
      translationKey,
      locale,
      ...(excludeId
        ? {
            id: {
              not: excludeId,
            },
          }
        : {}),
    },
    select: {
      id: true,
      deletedAt: true,
    },
  });

  if (!existing) {
    return;
  }

  const message = existing.deletedAt
    ? "A deleted solution already uses this translation key in the same locale"
    : "A solution already uses this translation key in the same locale";

  throw new ApiError("BAD_REQUEST", message, 409, {
    translationKey: [message],
  });
}
