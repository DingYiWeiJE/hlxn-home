import {
  MediaAssetType,
  Prisma,
} from "@prisma/client";
import { NextRequest } from "next/server";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { revalidateNewsCache } from "@/lib/news/cache";
import {
  newsDetailSelect,
  newsListSelect,
  normalizeNewsListItem,
} from "@/lib/news/queries";
import {
  listNewsQuerySchema,
  newsInputSchema,
} from "@/lib/news/schemas";
import {
  extractTextFromTiptapJson,
} from "@/lib/news/tiptap";
import { prisma } from "@/lib/prisma";
import {
  generateUniqueSlug,
} from "@/lib/slug/generate-slug";

export const runtime = "nodejs";

type NewsDetailPayload =
  Prisma.NewsGetPayload<{
    select: typeof newsDetailSelect;
  }>;

function formatNewsDetail(
  news: NewsDetailPayload,
) {
  return {
    ...news,

    // 暂时保留这个兼容字段，
    // 旧页面重构完成后可以删除。
    coverImage:
      news.coverImageAsset?.url ??
      null,
  };
}

async function validateCoverImageAsset(
  assetId:
    | string
    | null
    | undefined,
) {
  if (!assetId) {
    return;
  }

  const asset =
    await prisma.mediaAsset.findFirst({
      where: {
        id: assetId,
        type:
          MediaAssetType.IMAGE,
        enabled: true,
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

  if (!asset) {
    throw new ApiError(
      "MEDIA_NOT_FOUND",
      "所选择的新闻封面图片不存在或已停用",
      400,
      {
        coverImageAssetId: [
          "所选择的新闻封面图片不存在或已停用",
        ],
      },
    );
  }
}

/**
 * 前台新闻列表
 */
export async function GET(
  request: NextRequest,
) {
  try {
    const query =
      listNewsQuerySchema.parse(
        Object.fromEntries(
          request.nextUrl.searchParams,
        ),
      );

    const now = new Date();

    const where:
      Prisma.NewsWhereInput = {
      locale: query.locale,
      status: "PUBLISHED",
      deletedAt: null,

      publishedAt: {
        lte: now,
      },

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

          orderBy:
            query.sort ===
                "publishedAt" &&
              query.order ===
                "desc"
              ? [
                  {
                    isFeatured:
                      "desc",
                  },
                  {
                    publishedAt:
                      "desc",
                  },
                  {
                    createdAt:
                      "desc",
                  },
                ]
              : [
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
        items.map(
          normalizeNewsListItem,
        ),

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

/**
 * 创建新闻
 *
 * locale 必须传入 zh 或 en。
 * Slug 由后端根据最终标题生成。
 */
export async function POST(
  request: Request,
) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const input =
      newsInputSchema.parse(
        await request.json(),
      );

    await validateCoverImageAsset(
      input.coverImageAssetId,
    );

    const publishedAt =
      input.status === "PUBLISHED"
        ? input.publishedAt ??
          new Date()
        : input.publishedAt ??
          null;

    const created =
      await prisma.$transaction(
        async (transaction) => {

          if (input.sourceArticleId) {
            const imported =
              await transaction.news.findFirst({
                where: {
                  locale: input.locale,
                  sourceArticleId:
                    input.sourceArticleId,
                },

                select: {
                  id: true,
                  deletedAt: true,
                },
              });

            if (imported) {
              const message =
                imported.deletedAt
                  ? "该微信公众号文章已存在于回收站，请前往回收站恢复"
                  : "该微信公众号文章已经存在，请勿重复创建";

              throw new ApiError(
                "BAD_REQUEST",
                message,
                409,
                {
                  sourceUrl: [message],
                },
              );
            }
          }

          const slug =
            await generateUniqueSlug({
              source:
                input.title,

              maxLength: 120,

              exists: async (
                candidate,
              ) => {
                const existing =
                  await transaction.news
                    .findFirst({
                      where: {
                        locale:
                          input.locale,
                        slug:
                          candidate,
                      },

                      select: {
                        id: true,
                      },
                    });

                return (
                  existing !== null
                );
              },
            });

          return transaction.news
            .create({
              data: {
                title:
                  input.title,

                slug,

                locale:
                  input.locale,

                summary:
                  input.summary ||
                  null,

                coverImageAlt:
                  input.coverImageAlt ||
                  null,

                ...(input.coverImageAssetId
                  ? {
                      coverImageAsset: {
                        connect: {
                          id:
                            input.coverImageAssetId,
                        },
                      },
                    }
                  : {}),

                content:
                  input.content as Prisma.InputJsonValue,

                contentText:
                  extractTextFromTiptapJson(
                    input.content,
                  ),

                authorName:
                  input.authorName ||
                  null,

                status:
                  input.status,

                isFeatured:
                  input.isFeatured,

                publishedAt,

                sourceType:
                  input.sourceType,

                sourceUrl:
                  input.sourceUrl ||
                  null,

                sourceAccountName:
                  input.sourceAccountName ||
                  null,

                sourceArticleId:
                  input.sourceArticleId ||
                  null,

                sourcePublishedAt:
                  input.sourcePublishedAt ??
                  null,

                importedAt:
                  input.sourceType ===
                  "WECHAT"
                    ? new Date()
                    : null,

                importMeta:
                  input.importMeta ===
                    undefined ||
                  input.importMeta ===
                    null
                    ? Prisma.JsonNull
                    : (input.importMeta as Prisma.InputJsonValue),
              },

              select:
                newsDetailSelect,
            });
        },
      );

    revalidateNewsCache({
      newSlug: created.slug,
    });

    return ok(
      formatNewsDetail(created),
      {
        status: 201,
      },
    );
  } catch (error) {
    return fail(error);
  }
}