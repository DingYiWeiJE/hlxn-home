import { Prisma, ApplicationCaseLocale } from "@prisma/client";
import { NextRequest } from "next/server";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  adminApplicationCaseListQuerySchema,
  createApplicationCaseSchema,
} from "@/lib/application-cases/schemas";
import {
  validateApplicationCaseImage,
} from "@/lib/application-cases/validation";
import {
  generateUniqueSlug,
} from "@/lib/slug/generate-slug";

export const runtime = "nodejs";

/**
 * 后台应用案例列表
 *
 * GET /api/admin/application-cases
 *
 * 支持参数：
 * locale
 * keyword
 * deleted
 * page
 * pageSize
 * sort
 * order
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminActor();

    const query =
      adminApplicationCaseListQuerySchema.parse(
        Object.fromEntries(
          request.nextUrl.searchParams,
        ),
      );

    const where: Prisma.ApplicationCaseWhereInput = {
      deletedAt:
        query.deleted === true
          ? { not: null }
          : null,

      ...(query.locale
        ? {
            locale:
              query.locale as ApplicationCaseLocale,
          }
        : {}),

      ...(query.keyword
        ? {
            OR: [
              {
                title: {
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
      ...(query.sort !== "caseDate"
        ? [
            {
              caseDate: "desc" as const,
            },
          ]
        : []),
      ...(query.sort !== "createdAt"
        ? [
            {
              createdAt: "desc" as const,
            },
          ]
        : []),
    ] as Prisma.ApplicationCaseOrderByWithRelationInput[];

    const [items, total] =
      await prisma.$transaction([
        prisma.applicationCase.findMany({
          where,
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          orderBy,
          select: {
            id: true,
            locale: true,
            title: true,
            slug: true,
            caseDate: true,
            contentParagraphs: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            imageAsset: {
              select: {
                id: true,
                url: true,
                width: true,
                height: true,
                alt: true,
              },
            },
          },
        }),
        prisma.applicationCase.count({
          where,
        }),
      ]);

    const totalPages = Math.ceil(
      total / query.pageSize,
    );

    return ok({
      items: items.map((item) => ({
        ...item,
        contentParagraphCount: Array.isArray(
          item.contentParagraphs,
        )
          ? item.contentParagraphs.length
          : 0,
        contentParagraphs: undefined,
      })),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
        hasNextPage:
          query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * 创建应用案例
 *
 * POST /api/admin/application-cases
 */
export async function POST(request: Request) {
  try {
    const actor =
      await requireAdminActor();

    assertSameOriginRequest(request);

    const body = await request.json();

    const input =
      createApplicationCaseSchema.parse(body);

    await validateApplicationCaseImage(
      input.imageAssetId,
    );

    const slug = await generateUniqueSlug({
      source: input.title,
      exists: async (candidate) => {
        const existing =
          await prisma.applicationCase.findFirst(
            {
              where: {
                locale: input.locale as ApplicationCaseLocale,
                slug: candidate,
                deletedAt: null,
              },
            },
          );

        return Boolean(existing);
      },
    });

    const normalizedParagraphs = Array.isArray(
      input.contentParagraphs,
    )
      ? input.contentParagraphs
        .map(
          (p) =>
            typeof p === "string"
              ? p.trim()
              : "",
        )
        .filter(Boolean)
      : [];

    const applicationCase =
      await prisma.applicationCase.create({
        data: {
          locale:
            input.locale as ApplicationCaseLocale,
          title: input.title,
          slug,
          contentParagraphs:
            normalizedParagraphs,
          caseDate: input.caseDate,
          imageAssetId:
            input.imageAssetId,
          createdById: actor.userId,
          updatedById: actor.userId,
        },
        select: {
          id: true,
          locale: true,
          title: true,
          slug: true,
          contentParagraphs: true,
          caseDate: true,
          imageAssetId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return ok(applicationCase, {
      status: 201,
    });
  } catch (error) {
    return fail(error);
  }
}
