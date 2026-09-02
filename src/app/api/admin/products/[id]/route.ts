import {
  Prisma,
  ProductLocale,
} from "@prisma/client";

import { assertSameOriginRequest } from "@/lib/admin-auth/csrf";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { withMediaUrl } from "@/lib/media/asset-url";
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

  keyParametersTitle: true,
  keyParametersItems: true,

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
      relativePath: true,
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
          relativePath: true,
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
          relativePath: true,
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

/**
 * 判断产品优势 / 应用场景两组图片项是否与已存储的内容一致。
 *
 * 表单每次都会提交完整数组，这里按顺序比较素材 ID 与标题，
 * 一致则说明用户没有改动该子表，可跳过删除重建，减少数据库写入。
 */
function sameImageItems(
  existing: Array<{
    assetId: string;
    title: string;
  }>,
  incoming: Array<{
    assetId: string;
    title: string;
  }>,
): boolean {
  if (
    existing.length !== incoming.length
  ) {
    return false;
  }

  for (
    let index = 0;
    index < existing.length;
    index += 1
  ) {
    if (
      existing[index].assetId !==
        incoming[index].assetId ||
      existing[index].title.trim() !==
        incoming[index].title.trim()
    ) {
      return false;
    }
  }

  return true;
}

function formatProductDetail(
  product: ProductDetailPayload,
) {
  const hasSpecification =
    product.specificationTitle !== null ||
    product.specificationHeaders !== null ||
    product.specificationRows !== null;

  const hasKeyParameters =
    product.keyParametersTitle !== null ||
    product.keyParametersItems !== null;

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
      withMediaUrl(product.coverImageAsset),

    introBackgroundImageAssetId:
      product.introBackgroundImageAssetId,

    introBackgroundImageAsset:
      withMediaUrl(product.introBackgroundImageAsset),

    advantages:
      product.advantages.map((item) => ({
        ...item,
        asset: withMediaUrl(item.asset),
      })),

    applications:
      product.applications.map((item) => ({
        ...item,
        asset: withMediaUrl(item.asset),
      })),

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

    keyParameters: hasKeyParameters
      ? {
          title:
            product.keyParametersTitle ?? "",

          items:
            product.keyParametersItems ?? [],
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

          secondaryCategoryId: true,
          coverImageAssetId: true,
          introBackgroundImageAssetId: true,
          detailPdfAssetId: true,

          advantages: {
            orderBy: {
              sortOrder: "asc" as const,
            },
            select: {
              assetId: true,
              title: true,
            },
          },

          applications: {
            orderBy: {
              sortOrder: "asc" as const,
            },
            select: {
              assetId: true,
              title: true,
            },
          },
        },
      });

    if (!existingProduct) {
      throw new ApiError(
        "NOT_FOUND",
        "产品不存在",
        404,
      );
    }

    /*
     * 变更检测：表单每次都会提交完整字段，
     * 但只有真正变化的字段才需要重新校验引用、重写子表。
     * 未变化的部分直接跳过，避免不必要的远程数据库往返，
     * 让"只改了几个字"这种编辑几乎瞬间完成。
     */
    const advantagesChanged =
      body.advantages !== undefined &&
      !sameImageItems(
        existingProduct.advantages,
        body.advantages,
      );

    const applicationsChanged =
      body.applications !== undefined &&
      !sameImageItems(
        existingProduct.applications,
        body.applications,
      );

    const categoryChanged =
      body.secondaryCategoryId !==
        undefined &&
      body.secondaryCategoryId !==
        existingProduct.secondaryCategoryId;

    const coverChanged =
      body.coverImageAssetId !==
        undefined &&
      (body.coverImageAssetId ?? null) !==
        existingProduct.coverImageAssetId;

    const introBackgroundChanged =
      body.introBackgroundImageAssetId !==
        undefined &&
      body.introBackgroundImageAssetId !==
        existingProduct.introBackgroundImageAssetId;

    const detailPdfChanged =
      body.detailPdfAssetId !==
        undefined &&
      (body.detailPdfAssetId ?? null) !==
        existingProduct.detailPdfAssetId;

    await validateProductReferences({
      secondaryCategoryId:
        categoryChanged
          ? body.secondaryCategoryId
          : undefined,

      coverImageAssetId: coverChanged
        ? body.coverImageAssetId
        : undefined,

      introBackgroundImageAssetId:
        introBackgroundChanged
          ? body.introBackgroundImageAssetId
          : undefined,

      advantages: advantagesChanged
        ? body.advantages
        : undefined,

      applications: applicationsChanged
        ? body.applications
        : undefined,

      detailPdfAssetId: detailPdfChanged
        ? body.detailPdfAssetId
        : undefined,
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

    /*
     * 使用一次带嵌套写入的 update 完成保存：
     * Prisma 会把标量字段更新、子表的 deleteMany/create
     * 打包进一次隐式事务批量执行，并通过 select 直接返回最新数据，
     * 相比之前"交互式事务 + 逐条 deleteMany/createMany + 单独回读"
     * 大幅减少远程数据库往返次数，也不再受 5s 事务超时限制。
     * 未变化的子表（advantages / applications）完全跳过，不做删改。
     */
    const product =
      await prisma.product.update({
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

          ...(body.keyParameters !==
          undefined
            ? body.keyParameters === null
              ? {
                  keyParametersTitle:
                    null,

                  keyParametersItems:
                    Prisma.DbNull,
                }
              : {
                  keyParametersTitle:
                    body.keyParameters.title,

                  keyParametersItems:
                    body.keyParameters.items,
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

          ...(advantagesChanged &&
          body.advantages
            ? {
                advantages: {
                  deleteMany: {},

                  ...(body.advantages
                    .length > 0
                    ? {
                        create:
                          body.advantages.map(
                            (
                              item,
                              index,
                            ) => ({
                              assetId:
                                item.assetId,
                              title:
                                item.title,
                              sortOrder:
                                item.sortOrder ??
                                index,
                            }),
                          ),
                      }
                    : {}),
                },
              }
            : {}),

          ...(applicationsChanged &&
          body.applications
            ? {
                applications: {
                  deleteMany: {},

                  ...(body.applications
                    .length > 0
                    ? {
                        create:
                          body.applications.map(
                            (
                              item,
                              index,
                            ) => ({
                              assetId:
                                item.assetId,
                              title:
                                item.title,
                              sortOrder:
                                item.sortOrder ??
                                index,
                            }),
                          ),
                      }
                    : {}),
                },
              }
            : {}),
        },

        select: productDetailSelect,
      });

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
 *
 * 查询参数：
 * permanent=true 时执行永久删除
 */
export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    await requireAdminActor();
    assertSameOriginRequest(request);

    const { id } = await context.params;
    const url = new URL(request.url);
    const isPermanent =
      url.searchParams.get("permanent") === "true";

    if (isPermanent) {
      const product =
        await prisma.product.findFirst({
          where: {
            id,
            deletedAt: {
              not: null,
            },
          },
          select: {
            id: true,
          },
        });

      if (!product) {
        throw new ApiError(
          "NOT_FOUND",
          "产品不存在或未被删除",
          404,
        );
      }

      await prisma.product.delete({
        where: {
          id,
        },
      });

      clearCacheByNamespace("products");

      return ok({
        id,
        deleted: true,
        permanent: true,
      });
    }

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