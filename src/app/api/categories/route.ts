import {
  CategoryLevel,
  ProductLocale,
  ProductStatus,
} from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { withCache } from "@/lib/cache";

export const runtime = "nodejs";

const categoryListQuerySchema = z.object({
  locale: z.enum(["zh", "en"]).default("zh"),
});

/**
 * 前台产品分类接口
 *
 * GET /api/categories
 *
 * 一次返回：
 * 1. 全部启用的一级分类；
 * 2. 全部启用的二级分类。
 *
 * 前端未选择一级分类时，直接展示全部 secondaryCategories。
 * 选择一级分类后，根据 secondaryCategory.parentId 进行过滤。
 */
export async function GET(
  request: NextRequest,
) {
  try {
    const query =
      categoryListQuerySchema.parse(
        Object.fromEntries(
          request.nextUrl.searchParams,
        ),
      );

    const locale =
      query.locale as ProductLocale;

    const data = await withCache(
      "categories",
      query,
      async () => {
        const [
          primaryCategories,
          secondaryCategories,
        ] = await prisma.$transaction([
          prisma.category.findMany({
            where: {
              level: CategoryLevel.LEVEL_ONE,
              enabled: true,
              deletedAt: null,
            },
            orderBy: [
              {
                sortOrder: "asc",
              },
              {
                createdAt: "asc",
              },
            ],
            select: {
              id: true,
              name: true,
              nameEn: true,
              slug: true,
              sortOrder: true,

              _count: {
                select: {
                  children: {
                    where: {
                      level: CategoryLevel.LEVEL_TWO,
                      enabled: true,
                      deletedAt: null,
                    },
                  },
                },
              },
            },
          }),

          prisma.category.findMany({
            where: {
              level: CategoryLevel.LEVEL_TWO,
              enabled: true,
              deletedAt: null,

              parent: {
                is: {
                  level: CategoryLevel.LEVEL_ONE,
                  enabled: true,
                  deletedAt: null,
                },
              },
            },
            orderBy: [
              {
                sortOrder: "asc",
              },
              {
                createdAt: "asc",
              },
            ],
            select: {
              id: true,
              name: true,
              nameEn: true,
              slug: true,
              parentId: true,
              sortOrder: true,

              parent: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  slug: true,
                },
              },

              _count: {
                select: {
                  products: {
                    where: {
                      locale,
                      status: ProductStatus.PUBLISHED,
                      deletedAt: null,
                    },
                  },
                },
              },
            },
          }),
        ]);

        return {
          primaryCategories:
            primaryCategories.map(
              (category) => ({
                id: category.id,
                name: getCategoryName(
                  category,
                  locale,
                ),
                nameZh: category.name,
                nameEn: category.nameEn,
                slug: category.slug,
                sortOrder:
                  category.sortOrder,
                secondaryCategoryCount:
                  category._count.children,
              }),
            ),

          secondaryCategories:
            secondaryCategories.map(
              (category) => ({
                id: category.id,
                name: getCategoryName(
                  category,
                  locale,
                ),
                nameZh: category.name,
                nameEn: category.nameEn,
                slug: category.slug,
                parentId: category.parentId,
                sortOrder:
                  category.sortOrder,

                primaryCategory: {
                  id: category.parent!.id,
                  name: getCategoryName(
                    category.parent!,
                    locale,
                  ),
                  nameZh:
                    category.parent!.name,
                  nameEn:
                    category.parent!.nameEn,
                  slug: category.parent!.slug,
                },

                publishedProductCount:
                  category._count.products,
              }),
            ),
        };
      },
    );

    return ok(
      data,
      {
        headers: {
          "Cache-Control": "private, no-store",
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

