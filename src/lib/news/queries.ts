import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const newsListSelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  coverImage: true,
  coverImageAlt: true,
  authorName: true,
  status: true,
  isFeatured: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.NewsSelect;

export function normalizeNewsListItem(item: Prisma.NewsGetPayload<{ select: typeof newsListSelect }>) {
  return {
    ...item,
    href: `/news/${item.slug}`,
    image: item.coverImage ?? "/images/home/home-bg-1.jpg",
  };
}

export async function findPublishedNewsBySlug(slug: string) {
  const now = new Date();
  return prisma.news.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { lte: now },
    },
  });
}
