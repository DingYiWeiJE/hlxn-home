import {
  Prisma,
} from "@prisma/client";
import { NextRequest } from "next/server";

import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { fail, ok } from "@/lib/api/response";
import { buildMediaUrl } from "@/lib/media/asset-url";
import {
  newsListSelect,
} from "@/lib/news/queries";
import {
  adminListNewsQuerySchema,
} from "@/lib/news/schemas";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
) {
  try {
    await requireAdminActor();

    const query =
      adminListNewsQuerySchema.parse(
        Object.fromEntries(
          request.nextUrl.searchParams,
        ),
      );

    const where:
      Prisma.NewsWhereInput = {
      deletedAt:
        query.deleted === true
          ? {
              not: null,
            }
          : null,

      ...(query.locale
        ? {
            locale:
              query.locale,
          }
        : {}),

      ...(query.status
        ? {
            status:
              query.status,
          }
        : {}),

      ...(query.newsTypeId
        ? {
            newsTypeId:
              query.newsTypeId,
          }
        : {}),

      ...(query.featured ===
      undefined
        ? {}
        : {
            isFeatured:
              query.featured,
          }),

      ...(query.keyword
        ? {
            OR: [
              {
                title: {
                  contains:
                    query.keyword,
                  mode:
                    "insensitive",
                },
              },
              {
                summary: {
                  contains:
                    query.keyword,
                  mode:
                    "insensitive",
                },
              },
              {
                contentText: {
                  contains:
                    query.keyword,
                  mode:
                    "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] =
      await prisma.$transaction([
        prisma.news.findMany({
          where,

          select:
            newsListSelect,

          skip:
            (query.page - 1) *
            query.pageSize,

          take:
            query.pageSize,

          orderBy: [
            {
              [query.sort]:
                query.order,
            },
          ],
        }),

        prisma.news.count({
          where,
        }),
      ]);

    const totalPages =
      Math.ceil(
        total / query.pageSize,
      );

    return ok({
      items:
        items.map((item) => ({
          ...item,

          // 兼容当前旧新闻列表页面
          coverImage:
            item.coverImageAsset
              ? buildMediaUrl(
                  item.coverImageAsset
                    .relativePath,
                )
              : null,
        })),

      pagination: {
        page: query.page,
        pageSize:
          query.pageSize,
        total,
        totalPages,

        hasNextPage:
          query.page <
          totalPages,

        hasPreviousPage:
          query.page > 1,
      },
    });
  } catch (error) {
    return fail(error);
  }
}