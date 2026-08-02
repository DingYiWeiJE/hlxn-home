import {
  Prisma,
  ProductLocale,
} from "@prisma/client";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { updateProductSchema } from "@/lib/products/schemas";
import { validateProductReferences } from "@/lib/products/validation";
import { clearCacheByNamespace } from "@/lib/cache";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const productDetailSelect = {
  id: true,
  locale: true,
  name: true,
  slug: true,
  seriesName: true,
  secondaryCategoryId: true,

  summaryParagraphs: true,
  highlights: true,
  introductionParagraphs: true,

  specificationTitle: true,
  specificationHeaders: true,
  specificationRows: true,

  coverImageAssetId: true,
  introBackgroundImageAssetId: true,
  detailPdfAssetId: true,

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
      type: true,
      url: true,
      originalName: true,
      mimeType: true,
      size: true,
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
      sortOrder: "asc" as const,
    },

    select: {
      id: true,
      title: true,
      sortOrder: true,
      assetId: true,

      asset: {
        select: {
          id: true,
          type: true,
          url: true,
          originalName: true,
          mimeType: true,
          size: true,
          width: true,
          height: true,
          alt: true,
        },
      },
    },
  },

  applications: {
    orderBy: {
      sortOrder: "asc" as const,
    },

    select: {
      id: true,
      title: true,
      sortOrder: true,
      assetId: true,

      asset: {
        select: {
          id: true,
          type: true,
          url: true,
          originalName: true,
          mimeType: true,
          size: true,
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
      type: true,
      originalName: true,
      filename: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  },
} satisfies Prisma.ProductSelect;

type ProductDetailPayload =
  Prisma.ProductGetPayload<{
    select: typeof productDetailSelect;
  }>;

function formatProductDetail(
  product: ProductDetailPayload,
) {
  const hasSpecification =
    product.specificationTitle !== null ||
    product.specificationHeaders !== null ||
    product.specificationRows !== null;

  return {
    id: product.id,
    locale: product.locale,
    name: product.name,
    slug: product.slug,
    seriesName: product.seriesName,

    secondaryCategoryId:
      product.secondaryCategoryId,

    category: {
      primary:
        product.secondaryCategory.parent,

      secondary: {
        id: product.secondaryCategory.id,
        name: product.secondaryCategory.name,
        slug: product.secondaryCategory.slug,
      },
    },

    summaryParagraphs:
      product.summaryParagraphs,

    highlights:
      product.highlights,

    introductionParagraphs:
      product.introductionParagraphs,

    coverImageAssetId:
      product.coverImageAssetId,

    coverImage:
      product.coverImageAsset,

    introBackgroundImageAssetId:
      product.introBackgroundImageAssetId,

    introBackgroundImageAsset:
      product.introBackgroundImageAsset,

    advantages:
      product.advantages,

    applications:
      product.applications,

    specification: hasSpecification
      ? {
          title:
            product.specificationTitle ?? "",

          headers:
            product.specificationHeaders ?? [],

          rows:
            product.specificationRows ?? [],
        }
      : null,

    detailPdfAssetId:
      product.detailPdfAssetId,

    detailPdf: product.detailPdfAsset
      ? {
          id: product.detailPdfAsset.id,
          type: product.detailPdfAsset.type,
          originalName:
            product.detailPdfAsset.originalName,
          filename:
            product.detailPdfAsset.filename,
          mimeType:
            product.detailPdfAsset.mimeType,
          size:
            product.detailPdfAsset.size,
          createdAt:
            product.detailPdfAsset.createdAt,
          downloadUrl:
            `/api/downloads/${product.detailPdfAsset.id}`,
        }
      : null,

    status:
      product.status,

    sortOrder:
      product.sortOrder,

    publishedAt:
      product.publishedAt,

    createdAt:
      product.createdAt,

    updatedAt:
      product.updatedAt,

    deletedAt:
      product.deletedAt,
  };
}

/**
 * 查询单个产品
 *
 * GET /api/admin/products/:id
 */
export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    await requireAdminActor();

    const { id } = await context.params;

    const product =
      await prisma.product.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: productDetailSelect,
      });

    if (!product) {
      throw new ApiError(
        "NOT_FOUND",
        "产品不存在",
        404,
      );
    }

    return ok(
      formatProductDetail(product),
    );
  } catch (error) {
    return fail(error);
  }
}

/**
 * 编辑产品
 *
 * PATCH /api/admin/products/:id
 *
 * locale：
 * - 不提交：保持原语言；
 * - 提交 zh 或 en：修改产品语言。
 *
 * slug 与 locale 组合必须唯一。
 */
export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { id } = await context.params;

    const body = updateProductSchema.parse(
      await request.json(),
    );

    const existingProduct =
      await prisma.product.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: {
          id: true,
          locale: true,
          slug: true,
          status: true,
          publishedAt: true,
        },
      });

    if (!existingProduct) {
      throw new ApiError(
        "NOT_FOUND",
        "产品不存在",
        404,
      );
    }

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

    const nextLocale =
      body.locale !== undefined
        ? body.locale as ProductLocale
        : existingProduct.locale;

    /*
    * Slug 不允许从后台编辑。
    *
    * 修改产品名称时，原 Slug 保持不变。
    * 只有修改产品语言时，才需要检查原 Slug
    * 在目标语言下是否已经被其他产品占用。
    */
    if (
      nextLocale !== existingProduct.locale
    ) {
      const slugExists =
        await prisma.product.findFirst({
          where: {
            id: {
              not: id,
            },

            locale: nextLocale,
            slug: existingProduct.slug,
          },

          select: {
            id: true,
            deletedAt: true,
          },
        });

      if (slugExists) {
        const message =
          slugExists.deletedAt
            ? "目标语言下已有已删除产品使用相同地址"
            : "目标语言下已有产品使用相同地址";

        throw new ApiError(
          "SLUG_ALREADY_EXISTS",
          message,
          409,
          {
            locale: [message],
          },
        );
      }
    }
    let publishedAt:
      | Date
      | undefined;

    if (
      body.status === "PUBLISHED" &&
      !existingProduct.publishedAt
    ) {
      publishedAt = new Date();
    }

    const product =
      await prisma.$transaction(
        async (transaction) => {
          if (
            body.advantages !== undefined
          ) {
            await transaction
              .productAdvantage
              .deleteMany({
                where: {
                  productId: id,
                },
              });

            if (
              body.advantages.length > 0
            ) {
              await transaction
                .productAdvantage
                .createMany({
                  data:
                    body.advantages.map(
                      (item, index) => ({
                        productId: id,
                        assetId:
                          item.assetId,
                        title:
                          item.title,
                        sortOrder:
                          item.sortOrder ??
                          index,
                      }),
                    ),
                });
            }
          }

          if (
            body.applications !== undefined
          ) {
            await transaction
              .productApplication
              .deleteMany({
                where: {
                  productId: id,
                },
              });

            if (
              body.applications.length > 0
            ) {
              await transaction
                .productApplication
                .createMany({
                  data:
                    body.applications.map(
                      (item, index) => ({
                        productId: id,
                        assetId:
                          item.assetId,
                        title:
                          item.title,
                        sortOrder:
                          item.sortOrder ??
                          index,
                      }),
                    ),
                });
            }
          }

          await transaction.product.update({
            where: {
              id,
            },

            data: {
              ...(body.locale !== undefined
                ? {
                    locale:
                      body.locale as ProductLocale,
                  }
                : {}),

              ...(body.name !== undefined
                ? {
                    name: body.name,
                  }
                : {}),

              ...(body.seriesName !==
              undefined
                ? {
                    seriesName:
                      body.seriesName?.trim() ||
                      null,
                  }
                : {}),

              ...(body.secondaryCategoryId !==
              undefined
                ? {
                    secondaryCategoryId:
                      body.secondaryCategoryId,
                  }
                : {}),

              ...(body.summaryParagraphs !==
              undefined
                ? {
                    summaryParagraphs:
                      body.summaryParagraphs,
                  }
                : {}),

              ...(body.highlights !==
              undefined
                ? {
                    highlights:
                      body.highlights,
                  }
                : {}),

              ...(body.introductionParagraphs !==
              undefined
                ? {
                    introductionParagraphs:
                      body.introductionParagraphs,
                  }
                : {}),

              ...(body.specification !==
              undefined
                ? body.specification === null
                  ? {
                      specificationTitle:
                        null,

                      specificationHeaders:
                        Prisma.DbNull,

                      specificationRows:
                        Prisma.DbNull,
                    }
                  : {
                      specificationTitle:
                        body.specification.title,

                      specificationHeaders:
                        body.specification.headers,

                      specificationRows:
                        body.specification.rows,
                    }
                : {}),

              ...(body.coverImageAssetId !==
              undefined
                ? {
                    coverImageAssetId:
                      body.coverImageAssetId,
                  }
                : {}),

              ...(body.introBackgroundImageAssetId !==
                undefined
                  ? {
                      introBackgroundImageAssetId:
                        body.introBackgroundImageAssetId,
                    }
                  : {}),

              ...(body.detailPdfAssetId !==
              undefined
                ? {
                    detailPdfAssetId:
                      body.detailPdfAssetId,
                  }
                : {}),

              ...(body.status !== undefined
                ? {
                    status: body.status,
                  }
                : {}),

              ...(body.sortOrder !== undefined
                ? {
                    sortOrder:
                      body.sortOrder,
                  }
                : {}),

              ...(publishedAt !== undefined
                ? {
                    publishedAt,
                  }
                : {}),
            },
          });

          return transaction.product
            .findUniqueOrThrow({
              where: {
                id,
              },
              select:
                productDetailSelect,
            });
        },
      );

    clearCacheByNamespace("products");

    return ok(
      formatProductDetail(product),
    );
  } catch (error) {
    return fail(error);
  }
}

/**
 * 软删除产品
 *
 * DELETE /api/admin/products/:id
 */
export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { id } = await context.params;

    const product =
      await prisma.product.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

    if (!product) {
      throw new ApiError(
        "NOT_FOUND",
        "产品不存在",
        404,
      );
    }

    await prisma.product.update({
      where: {
        id,
      },
      data: {
        status: "OFFLINE",
        deletedAt: new Date(),
      },
    });

    clearCacheByNamespace("products");

    return ok({
      id,
      deleted: true,
    });
  } catch (error) {
    return fail(error);
  }
}