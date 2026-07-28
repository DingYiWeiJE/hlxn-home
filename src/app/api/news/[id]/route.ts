import {
  MediaAssetType,
  Prisma,
} from "@prisma/client";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { revalidateNewsCache } from "@/lib/news/cache";
import {
  newsDetailSelect,
} from "@/lib/news/queries";
import {
  newsPatchSchema,
} from "@/lib/news/schemas";
import {
  extractTextFromTiptapJson,
} from "@/lib/news/tiptap";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type NewsDetailPayload =
  Prisma.NewsGetPayload<{
    select: typeof newsDetailSelect;
  }>;

function formatNewsDetail(
  news: NewsDetailPayload,
) {
  return {
    ...news,

    // 兼容旧编辑页面，后续重构表单后删除。
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

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireAdminActor();

    const { id } =
      await context.params;

    const news =
      await prisma.news.findFirst({
        where: {
          id,
          deletedAt: null,
        },

        select:
          newsDetailSelect,
      });

    if (!news) {
      throw new ApiError(
        "NEWS_NOT_FOUND",
        "新闻不存在",
        404,
      );
    }

    return ok(
      formatNewsDetail(news),
    );
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { id } =
      await context.params;

    const existing =
      await prisma.news.findFirst({
        where: {
          id,
          deletedAt: null,
        },

        select: {
          id: true,
          slug: true,
          locale: true,
          status: true,
          publishedAt: true,

          sourceType: true,
          sourceUrl: true,
          sourceArticleId: true,
          importedAt: true,
        },
      });

    if (!existing) {
      throw new ApiError(
        "NEWS_NOT_FOUND",
        "新闻不存在",
        404,
      );
    }

    const input =
      newsPatchSchema.parse(
        await request.json(),
      );

    if (
      input.coverImageAssetId !==
      undefined
    ) {
      await validateCoverImageAsset(
        input.coverImageAssetId,
      );
    }

    const nextLocale =
      input.locale ??
      existing.locale;

    /*
     * Slug 创建后不可修改。
     * 只有修改语言时，检查原 Slug
     * 在目标语言下是否冲突。
     */
    if (
      nextLocale !==
      existing.locale
    ) {
      const slugExists =
        await prisma.news.findFirst({
          where: {
            id: {
              not: id,
            },

            locale:
              nextLocale,

            slug:
              existing.slug,
          },

          select: {
            id: true,
          },
        });

      if (slugExists) {
        throw new ApiError(
          "SLUG_ALREADY_EXISTS",
          "目标语言下已有新闻使用相同页面地址",
          409,
          {
            locale: [
              "目标语言下已有新闻使用相同页面地址",
            ],
          },
        );
      }
    }

    const nextSourceType =
      input.sourceType ??
      existing.sourceType;

    const nextSourceUrl =
      input.sourceUrl !==
      undefined
        ? input.sourceUrl
        : existing.sourceUrl;

    if (
      nextSourceType ===
        "WECHAT" &&
      !nextSourceUrl
    ) {
      throw new ApiError(
        "BAD_REQUEST",
        "微信公众号新闻必须保留原文地址",
        400,
        {
          sourceUrl: [
            "微信公众号新闻必须保留原文地址",
          ],
        },
      );
    }

    const nextSourceArticleId =
      input.sourceArticleId !==
      undefined
        ? input.sourceArticleId
        : existing.sourceArticleId;

    if (
      nextSourceArticleId &&
      (nextSourceArticleId !==
        existing.sourceArticleId ||
        nextLocale !==
          existing.locale)
    ) {
      const imported =
        await prisma.news.findFirst({
          where: {
            id: {
              not: id,
            },

            locale:
              nextLocale,

            sourceArticleId:
              nextSourceArticleId,
          },

          select: {
            id: true,
          },
        });

      if (imported) {
        throw new ApiError(
          "BAD_REQUEST",
          "该微信公众号文章已经导入",
          409,
          {
            sourceUrl: [
              "该微信公众号文章已经导入",
            ],
          },
        );
      }
    }

    const firstPublish =
      existing.status !==
        "PUBLISHED" &&
      input.status ===
        "PUBLISHED" &&
      !existing.publishedAt &&
      input.publishedAt ===
        undefined;

    const data:
      Prisma.NewsUpdateInput = {
      ...(input.title !==
      undefined
        ? {
            title: input.title,
          }
        : {}),

      ...(input.locale !==
      undefined
        ? {
            locale:
              input.locale,
          }
        : {}),

      ...(input.summary !==
      undefined
        ? {
            summary:
              input.summary ||
              null,
          }
        : {}),

      ...(input.coverImageAssetId !==
      undefined
        ? input.coverImageAssetId
          ? {
              coverImageAsset: {
                connect: {
                  id:
                    input.coverImageAssetId,
                },
              },
            }
          : {
              coverImageAsset: {
                disconnect: true,
              },
            }
        : {}),

      ...(input.coverImageAlt !==
      undefined
        ? {
            coverImageAlt:
              input.coverImageAlt ||
              null,
          }
        : {}),

      ...(input.content !==
      undefined
        ? {
            content:
              input.content as Prisma.InputJsonValue,

            contentText:
              extractTextFromTiptapJson(
                input.content,
              ),
          }
        : {}),

      ...(input.authorName !==
      undefined
        ? {
            authorName:
              input.authorName ||
              null,
          }
        : {}),

      ...(input.status !==
      undefined
        ? {
            status:
              input.status,
          }
        : {}),

      ...(input.isFeatured !==
      undefined
        ? {
            isFeatured:
              input.isFeatured,
          }
        : {}),

      ...(input.publishedAt !==
      undefined
        ? {
            publishedAt:
              input.publishedAt,
          }
        : firstPublish
          ? {
              publishedAt:
                new Date(),
            }
          : {}),

      ...(input.sourceType !==
      undefined
        ? {
            sourceType:
              input.sourceType,
          }
        : {}),

      ...(input.sourceUrl !==
      undefined
        ? {
            sourceUrl:
              input.sourceUrl ||
              null,
          }
        : {}),

      ...(input.sourceAccountName !==
      undefined
        ? {
            sourceAccountName:
              input.sourceAccountName ||
              null,
          }
        : {}),

      ...(input.sourceArticleId !==
      undefined
        ? {
            sourceArticleId:
              input.sourceArticleId ||
              null,
          }
        : {}),

      ...(input.sourcePublishedAt !==
      undefined
        ? {
            sourcePublishedAt:
              input.sourcePublishedAt,
          }
        : {}),

      ...(input.importMeta !==
      undefined
        ? {
            importMeta:
              input.importMeta ===
              null
                ? Prisma.JsonNull
                : (input.importMeta as Prisma.InputJsonValue),
          }
        : {}),

      ...(input.sourceType ===
        "WECHAT" &&
      !existing.importedAt
        ? {
            importedAt:
              new Date(),
          }
        : {}),

      ...(input.sourceType ===
      "MANUAL"
        ? {
            importedAt: null,
          }
        : {}),
    };

    const updated =
      await prisma.news.update({
        where: {
          id,
        },

        data,

        select:
          newsDetailSelect,
      });

    revalidateNewsCache({
      oldSlug: existing.slug,
      newSlug: updated.slug,
    });

    return ok(
      formatNewsDetail(updated),
    );
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { id } =
      await context.params;

    const existing =
      await prisma.news.findFirst({
        where: {
          id,
          deletedAt: null,
        },

        select: {
          id: true,
          slug: true,
        },
      });

    if (!existing) {
      throw new ApiError(
        "NEWS_NOT_FOUND",
        "新闻不存在",
        404,
      );
    }

    const updated =
      await prisma.news.update({
        where: {
          id,
        },

        data: {
          deletedAt:
            new Date(),
        },

        select: {
          id: true,
          slug: true,
          deletedAt: true,
        },
      });

    revalidateNewsCache({
      oldSlug:
        existing.slug,
      newSlug:
        updated.slug,
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}