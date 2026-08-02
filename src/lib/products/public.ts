import {
  ProductLocale,
  ProductStatus,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const publicProductListSelect = {
  id: true,
  locale: true,
  name: true,
  slug: true,
  summaryParagraphs: true,
  coverImageAsset: {
    select: {
      url: true,
    },
  },
} satisfies Prisma.ProductSelect;

export async function listFeaturedProducts(
  locale: ProductLocale,
  take: number,
) {
  return prisma.product.findMany({
    where: {
      locale,
      status: ProductStatus.PUBLISHED,
      deletedAt: null,
      secondaryCategory: {
        enabled: true,
        deletedAt: null,
        parent: {
          is: {
            enabled: true,
            deletedAt: null,
          },
        },
      },
    },
    select: publicProductListSelect,
    take,
    orderBy: [
      {
        sortOrder: "asc",
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
