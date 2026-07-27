import {
  CategoryLevel,
  ProductStatus,
} from "@prisma/client";

import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
export async function GET() {
  try {
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
          slug: true,
          parentId: true,
          sortOrder: true,

          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },

          _count: {
            select: {
              products: {
                where: {
                  status: ProductStatus.PUBLISHED,
                  deletedAt: null,
                },
              },
            },
          },
        },
      }),
    ]);

    return ok(
      {
        primaryCategories:
          primaryCategories.map(
            (category) => ({
              id: category.id,
              name: category.name,
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
              name: category.name,
              slug: category.slug,
              parentId: category.parentId,
              sortOrder:
                category.sortOrder,

              primaryCategory:
                category.parent,

              publishedProductCount:
                category._count.products,
            }),
          ),
      },
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