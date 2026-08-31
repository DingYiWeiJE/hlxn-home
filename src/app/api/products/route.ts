import {
  Prisma,
  ProductLocale,
  ProductStatus,
} from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/response";
import { buildMediaUrl } from "@/lib/media/asset-url";
import { prisma } from "@/lib/prisma";
import { withCache } from "@/lib/cache";

export const runtime = "nodejs";

const productListQuerySchema = z.object({
  locale: z.enum(["zh", "en"], {
    message: "请指定产品语言，支持 zh 或 en",
  }),

  keyword: z
    .string()
    .trim()
    .max(100, "搜索关键词不能超过 100 个字符")
    .optional(),

  primaryCategoryId: z
    .string()
    .trim()
    .min(1)
    .optional(),

  secondaryCategoryId: z
    .string()
    .trim()
    .min(1)
    .optional(),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(12),
});

/**
 * 前台产品列表
 *
 * GET /api/products?locale=zh
 * GET /api/products?locale=en
 *
 * 按一级分类筛选：
 * GET /api/products?locale=zh&primaryCategoryId=xxx
 *
 * 按二级分类筛选：
 * GET /api/products?locale=zh&secondaryCategoryId=xxx
 */
export async function GET(
  request: NextRequest,
) {
  try {
    console.log(`[PRODUCTS-API] GET 方法被调用，locale=${request.nextUrl.searchParams.get('locale')}`);

    const query =
      productListQuerySchema.parse(
        Object.fromEntries(
          request.nextUrl.searchParams,
        ),
      );

    const data = await withCache(
      "products",
      query,
      async () => {
        const locale =
          query.locale as ProductLocale;

        const where: Prisma.ProductWhereInput = {
          locale,
          status: ProductStatus.PUBLISHED,
          deletedAt: null,

          // 二级分类及其所属一级分类必须正常启用
          secondaryCategory: {
            enabled: true,
            deletedAt: null,

            parent: {
              is: {
                enabled: true,
                deletedAt: null,
              },
            },

            ...(query.primaryCategoryId
              ? {
                  parentId:
                    query.primaryCategoryId,
                }
              : {}),
          },

          ...(query.secondaryCategoryId
            ? {
                secondaryCategoryId:
                  query.secondaryCategoryId,
              }
            : {}),

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
                    seriesName: {
                      contains: query.keyword,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),
        };

        const [items, total] =
          await prisma.$transaction([
            prisma.product.findMany({
              where,

              skip:
                (query.page - 1) *
                query.pageSize,

              take: query.pageSize,

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

              select: {
                id: true,
                locale: true,
                name: true,
                slug: true,
                seriesName: true,
                summaryParagraphs: true,
                highlights: true,
                publishedAt: true,

                coverImageAsset: {
                  select: {
                    id: true,
                    relativePath: true,
                    width: true,
                    height: true,
                    alt: true,
                  },
                },

                secondaryCategory: {
                  select: {
                    id: true,
                    name: true,
                    nameEn: true,
                    slug: true,

                    parent: {
                      select: {
                        id: true,
                        name: true,
                        nameEn: true,
                        slug: true,
                      },
                    },
                  },
                },
              },
            }),

            prisma.product.count({
              where,
            }),
          ]);

        const totalPages = Math.ceil(
          total / query.pageSize,
        );

        return {
          locale,

          items: items.map((item) => ({
            id: item.id,
            locale: item.locale,
            name: item.name,
            slug: item.slug,
            seriesName: item.seriesName,

            summaryParagraphs:
              item.summaryParagraphs,

            highlights:
              item.highlights,

            coverImage:
              item.coverImageAsset
                ? {
                    ...item.coverImageAsset,
                    url: buildMediaUrl(
                      item.coverImageAsset.relativePath,
                    ),
                  }
                : null,

            category: {
              primary: {
                id:
                  item.secondaryCategory.parent!.id,
                name: getCategoryName(
                  item.secondaryCategory.parent!,
                  locale,
                ),
                slug:
                  item.secondaryCategory.parent!.slug,
              },

              secondary: {
                id:
                  item.secondaryCategory.id,

                name: getCategoryName(
                  item.secondaryCategory,
                  locale,
                ),

                slug:
                  item.secondaryCategory.slug,
              },
            },

            publishedAt:
              item.publishedAt,

            detailUrl:
              `/${item.locale}/products/${item.slug}`,
          })),

          pagination: {
            page: query.page,
            pageSize: query.pageSize,
            total,
            totalPages,

            hasNextPage:
              query.page < totalPages,

            hasPreviousPage:
              query.page > 1,
          },
        };
      },
      10 * 60 * 1000,
    );

    return ok(
      data,
      {
        headers: {
          "Cache-Control":
            "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    return fail(error);
  }
}

function getCategoryName(
  category: {
    name: string;
    nameEn: string;
  },
  locale: ProductLocale,
) {
  if (locale === "en") {
    return category.nameEn.trim() || category.name;
  }

  return category.name;
}
