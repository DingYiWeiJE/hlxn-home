import { Prisma, SolutionLocale } from "@prisma/client";
import { NextRequest } from "next/server";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug/generate-slug";
import {
  adminSolutionListQuerySchema,
  createSolutionSchema,
} from "@/lib/solutions/schemas";
import { validateSolutionReferences } from "@/lib/solutions/validation";
import { clearCacheByNamespace } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor();

    const query = adminSolutionListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const where: Prisma.SolutionWhereInput = {
      deletedAt: query.deleted === true ? { not: null } : null,
      ...(query.locale ? { locale: query.locale as SolutionLocale } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.keyword
        ? {
            OR: [
              {
                name: {
                  contains: query.keyword,
                  mode: "insensitive",
                },
              },
              {
                slug: {
                  contains: query.keyword,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const orderBy = [
      {
        [query.sort]: query.order,
      },
      ...(query.sort === "sortOrder"
        ? [
            {
              createdAt: "desc" as const,
            },
          ]
        : []),
    ] as Prisma.SolutionOrderByWithRelationInput[];

    const [items, total] = await prisma.$transaction([
      prisma.solution.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy,
        select: {
          id: true,
          locale: true,
          name: true,
          slug: true,
          status: true,
          sortOrder: true,
          translationKey: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          coverImageAsset: {
            select: {
              id: true,
              url: true,
              originalName: true,
              width: true,
              height: true,
              alt: true,
            },
          },
          workingPrincipleBackgroundAsset: {
            select: {
              id: true,
              url: true,
              originalName: true,
              width: true,
              height: true,
              alt: true,
            },
          },
          _count: {
            select: {
              usageScenarios: true,
              customerValues: true,
            },
          },
        },
      }),
      prisma.solution.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(total / query.pageSize);

    return ok({
      items: items.map((item) => ({
        id: item.id,
        locale: item.locale,
        name: item.name,
        slug: item.slug,
        status: item.status,
        sortOrder: item.sortOrder,
        translationKey: item.translationKey,
        publishedAt: item.publishedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        deletedAt: item.deletedAt,
        coverImage: item.coverImageAsset,
        workingPrincipleBackgroundImage:
          item.workingPrincipleBackgroundAsset,
        counts: {
          usageScenarios: item._count.usageScenarios,
          customerValues: item._count.customerValues,
        },
        detailUrl: `/${item.locale}/solutions/${item.slug}`,
      })),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdminActor();
    assertSameOriginRequest(request);

    const body = createSolutionSchema.parse(await request.json());

    await validateSolutionReferences({
      coverImageAssetId: body.coverImageAssetId,
      workingPrincipleBackgroundAssetId:
        body.workingPrincipleBackgroundAssetId,
      usageScenarios: body.usageScenarios,
      customerValues: body.customerValues,
      requireWorkingPrincipleBackground: true,
    });

    await ensureTranslationKeyAvailable({
      translationKey: body.translationKey,
      locale: body.locale as SolutionLocale,
    });

    const solution = await prisma.$transaction(async (transaction) => {
      const locale = body.locale as SolutionLocale;
      const slug = await generateUniqueSlug({
        source: body.name,
        maxLength: 150,
        exists: async (candidate) => {
          const existing = await transaction.solution.findFirst({
            where: {
              locale,
              slug: candidate,
            },
            select: {
              id: true,
            },
          });

          return existing !== null;
        },
      });

      return transaction.solution.create({
        data: {
          locale,
          name: body.name,
          slug,
          status: body.status,
          sortOrder: body.sortOrder,
          translationKey: body.translationKey,
          coverImageAssetId: body.coverImageAssetId,
          summaryParagraphs: body.summaryParagraphs,
          highlights: body.highlights,
          workingPrincipleParagraphs: body.workingPrincipleParagraphs,
          workingPrincipleBackgroundAssetId:
            body.workingPrincipleBackgroundAssetId,
          systemCompositionParagraphs: body.systemCompositionParagraphs,
          createdBy: actor.userId,
          updatedBy: actor.userId,
          publishedAt:
            body.status === "PUBLISHED"
              ? body.publishedAt ?? new Date()
              : null,
          usageScenarios: {
            create: body.usageScenarios.map((item, index) => ({
              title: item.title,
              detailParagraphs: item.detailParagraphs,
              imageAssetId: item.imageAssetId,
              sortOrder: item.sortOrder ?? index,
            })),
          },
          customerValues: {
            create: body.customerValues.map((item, index) => ({
              title: item.title,
              detailParagraphs: item.detailParagraphs,
              imageAssetId: item.imageAssetId,
              sortOrder: item.sortOrder ?? index,
            })),
          },
        },
        select: {
          id: true,
          locale: true,
          name: true,
          slug: true,
        },
      });
    });

    clearCacheByNamespace("solutions");

    return ok(solution, {
      status: 201,
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
