import type {
  NewsLocale,
  Prisma,
} from "@prisma/client";

import { buildMediaUrl } from "@/lib/media/asset-url";
import { prisma } from "@/lib/prisma";

export const newsListSelect = {
  id: true,
  title: true,
  slug: true,
  locale: true,
  summary: true,

  coverImageAssetId: true,
  coverImageAlt: true,

  coverImageAsset: {
    select: {
      id: true,
      relativePath: true,
      filename: true,
      originalName: true,
      mimeType: true,
      size: true,
      width: true,
      height: true,
      alt: true,
    },
  },

  authorName: true,
  status: true,
  isFeatured: true,

  sourceType: true,
  sourceAccountName: true,
  sourcePublishedAt: true,
  importedAt: true,

  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.NewsSelect;

export const newsDetailSelect = {
  ...newsListSelect,

  content: true,
  contentText: true,

  sourceUrl: true,
  sourceArticleId: true,
  importMeta: true,
} satisfies Prisma.NewsSelect;

type NewsListPayload =
  Prisma.NewsGetPayload<{
    select: typeof newsListSelect;
  }>;

export function normalizeNewsListItem(
  item: NewsListPayload,
) {
  const coverImage =
    item.coverImageAsset
      ? {
          ...item.coverImageAsset,

          url: buildMediaUrl(
            item.coverImageAsset.relativePath,
          ),

          alt:
            item.coverImageAlt ||
            item.coverImageAsset.alt,
        }
      : null;

  return {
    ...item,
    coverImage,

    href:
      `/${item.locale}/news/${item.slug}`,

    image:
      coverImage?.url ??
      "/images/home/home-bg-1.jpg",
  };
}

export async function listPublishedNews(
  locale: NewsLocale,
  pageSize: number,
) {
  const now = new Date();

  return prisma.news.findMany({
    where: {
      locale,
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: {
        lte: now,
      },
    },
    select: newsListSelect,
    take: pageSize,
    orderBy: [
      {
        isFeatured: "desc",
      },
      {
        publishedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function findPublishedNewsBySlug(
  slug: string,
  locale?: NewsLocale,
) {
  const now = new Date();

  return prisma.news.findFirst({
    where: {
      slug,

      ...(locale
        ? {
            locale,
          }
        : {}),

      status: "PUBLISHED",
      deletedAt: null,

      publishedAt: {
        lte: now,
      },
    },

    select: newsDetailSelect,
  });
}
