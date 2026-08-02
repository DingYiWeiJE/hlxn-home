import {
  Prisma,
  ProductLocale,
} from "@prisma/client";
import { NextRequest } from "next/server";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { fail, ok } from "@/lib/api/response";
import { generateUniqueSlug } from "@/lib/slug/generate-slug";
import { prisma } from "@/lib/prisma";
import {
  adminProductListQuerySchema,
  createProductSchema,
} from "@/lib/products/schemas";
import { validateProductReferences } from "@/lib/products/validation";
import { clearCacheByNamespace } from "@/lib/cache";

export const runtime = "nodejs";

/**
 * 后台产品列表
 *
 * GET /api/admin/products
 *
 * 支持参数：
 * locale
 * keyword
 * status
 * primaryCategoryId
 * secondaryCategoryId
 * deleted
 * page
 * pageSize
 * sort
 * order
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminActor();

    const query = adminProductListQuerySchema.parse(
      Object.fromEntries(
        request.nextUrl.searchParams,
      ),
    );

    const where: Prisma.ProductWhereInput = {
      deletedAt:
        query.deleted === true
          ? {
              not: null,
            }
          : null,

      ...(query.locale
        ? {
            locale:
              query.locale as ProductLocale,
          }
        : {}),

      ...(query.status
        ? {
            status: query.status,
          }
        : {}),

      ...(query.secondaryCategoryId
        ? {
            secondaryCategoryId:
              query.secondaryCategoryId,
          }
        : {}),

      ...(query.primaryCategoryId
        ? {
            secondaryCategory: {
              parentId:
                query.primaryCategoryId,
            },
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
      ...(query.sort === "sortOrder"
        ? [
            {
              createdAt: "desc" as const,
            },
          ]
        : []),
    ] as Prisma.ProductOrderByWithRelationInput[];

    const [items, total] =
      await prisma.$transaction([
        prisma.product.findMany({
          where,

          skip:
            (query.page - 1) *
            query.pageSize,

          take: query.pageSize,

          orderBy,

          select: {
            id: true,
            locale: true,
            name: true,
            slug: true,
            seriesName: true,
            status: true,
            sortOrder: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,

            secondaryCategory: {
              select: {
                id: true,
                name: true,
                slug: true,

                parent: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },

            coverImageAsset: {
              select: {
                id: true,
                url: true,
                originalName: true,
                width: true,
                height: true,
                alt: true,
              },
            },

            detailPdfAsset: {
              select: {
                id: true,
                originalName: true,
                size: true,
              },
            },

            _count: {
              select: {
                advantages: true,
                applications: true,
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

    return ok({
      items: items.map((item) => ({
        id: item.id,
        locale: item.locale,
        name: item.name,
        slug: item.slug,
        seriesName: item.seriesName,
        status: item.status,
        sortOrder: item.sortOrder,
        publishedAt: item.publishedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        deletedAt: item.deletedAt,

        category: {
          primary:
            item.secondaryCategory.parent,

          secondary: {
            id:
              item.secondaryCategory.id,
            name:
              item.secondaryCategory.name,
            slug:
              item.secondaryCategory.slug,
          },
        },

        coverImage:
          item.coverImageAsset,

        detailPdf: item.detailPdfAsset
          ? {
              id:
                item.detailPdfAsset.id,

              originalName:
                item.detailPdfAsset
                  .originalName,

              size:
                item.detailPdfAsset.size,

              downloadUrl:
                `/api/downloads/${item.detailPdfAsset.id}`,
            }
          : null,

        counts: {
          advantages:
            item._count.advantages,

          applications:
            item._count.applications,
        },
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
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * 创建产品
 *
 * POST /api/admin/products
 *
 * locale 必须传入 zh 或 en。
 * Slug 由后端根据产品名称自动生成。
 * 同一种语言下重复时自动追加 -2、-3。
 */
export async function POST(request: Request) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const body = createProductSchema.parse(
      await request.json(),
    );

    await validateProductReferences({
      secondaryCategoryId:
        body.secondaryCategoryId,

      coverImageAssetId:
        body.coverImageAssetId,

      introBackgroundImageAssetId:
        body.introBackgroundImageAssetId,

      advantages:
        body.advantages,

      applications:
        body.applications,

      detailPdfAssetId:
        body.detailPdfAssetId,
    });

    const locale =
      body.locale as ProductLocale;

    const publishedAt =
      body.status === "PUBLISHED"
        ? new Date()
        : null;

    const product =
      await prisma.$transaction(
        async (transaction) => {
          const slug =
            await generateUniqueSlug({
              source: body.name,
              maxLength: 150,

              exists: async (
                candidate,
              ) => {
                const existingProduct =
                  await transaction.product
                    .findFirst({
                      where: {
                        locale,
                        slug: candidate,
                      },

                      select: {
                        id: true,
                      },
                    });

                return (
                  existingProduct !== null
                );
              },
            });

          return transaction.product.create({
            data: {
              locale,

              name: body.name,
              slug,

              seriesName:
                body.seriesName?.trim() ||
                null,

              secondaryCategoryId:
                body.secondaryCategoryId,

              summaryParagraphs:
                body.summaryParagraphs,

              highlights:
                body.highlights,

              introductionParagraphs:
                body.introductionParagraphs,

              specificationTitle:
                body.specification?.title ??
                null,

              specificationHeaders:
                body.specification
                  ? body.specification.headers
                  : Prisma.DbNull,

              specificationRows:
                body.specification
                  ? body.specification.rows
                  : Prisma.DbNull,

              coverImageAssetId:
                body.coverImageAssetId ??
                null,

              introBackgroundImageAssetId:
                body.introBackgroundImageAssetId,

              detailPdfAssetId:
                body.detailPdfAssetId ??
                null,

              status:
                body.status,

              sortOrder:
                body.sortOrder,

              publishedAt,

              ...(body.advantages.length > 0
                ? {
                    advantages: {
                      create:
                        body.advantages.map(
                          (item, index) => ({
                            assetId:
                              item.assetId,

                            title:
                              item.title,

                            sortOrder:
                              item.sortOrder ??
                              index,
                          }),
                        ),
                    },
                  }
                : {}),

              ...(body.applications.length >
              0
                ? {
                    applications: {
                      create:
                        body.applications.map(
                          (item, index) => ({
                            assetId:
                              item.assetId,

                            title:
                              item.title,

                            sortOrder:
                              item.sortOrder ??
                              index,
                          }),
                        ),
                    },
                  }
                : {}),
            },

            select: {
              id: true,
              locale: true,
              name: true,
              slug: true,
              seriesName: true,

              summaryParagraphs: true,
              highlights: true,
              introductionParagraphs: true,

              specificationTitle: true,
              specificationHeaders: true,
              specificationRows: true,

              status: true,
              sortOrder: true,
              publishedAt: true,
              createdAt: true,
              updatedAt: true,

              secondaryCategory: {
                select: {
                  id: true,
                  name: true,
                  slug: true,

                  parent: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },

              coverImageAsset: {
                select: {
                  id: true,
                  url: true,
                  originalName: true,
                  width: true,
                  height: true,
                  alt: true,
                },
              },

              introBackgroundImageAsset: {
                select: {
                  id: true,
                  type: true,
                  url: true,
                  filename: true,
                  originalName: true,
                  mimeType: true,
                  size: true,
                  width: true,
                  height: true,
                  alt: true,
                },
              },

              advantages: {
                orderBy: {
                  sortOrder: "asc",
                },

                select: {
                  id: true,
                  title: true,
                  sortOrder: true,

                  asset: {
                    select: {
                      id: true,
                      url: true,
                      originalName: true,
                      width: true,
                      height: true,
                      alt: true,
                    },
                  },
                },
              },

              applications: {
                orderBy: {
                  sortOrder: "asc",
                },

                select: {
                  id: true,
                  title: true,
                  sortOrder: true,

                  asset: {
                    select: {
                      id: true,
                      url: true,
                      originalName: true,
                      width: true,
                      height: true,
                      alt: true,
                    },
                  },
                },
              },

              detailPdfAsset: {
                select: {
                  id: true,
                  originalName: true,
                  mimeType: true,
                  size: true,
                },
              },
            },
          });
        },
      );

    clearCacheByNamespace("products");

    return ok(
      {
        ...product,

        detailPdf:
          product.detailPdfAsset
            ? {
                ...product.detailPdfAsset,

                downloadUrl:
                  `/api/downloads/${product.detailPdfAsset.id}`,
              }
            : null,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return fail(error);
  }
}