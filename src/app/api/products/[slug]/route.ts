import {
  MediaAssetType,
  Prisma,
  ProductLocale,
  ProductStatus,
} from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { withCache } from "@/lib/cache";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

const querySchema = z.object({
  locale: z.enum(["zh", "en"], {
    message: "请指定产品语言，支持 zh 或 en",
  }),
});

const productDetailSelect = {
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
      type: true,
      url: true,
      originalName: true,
      mimeType: true,
      width: true,
      height: true,
      alt: true,
      enabled: true,
      deletedAt: true,
    },
  },

  introBackgroundImageAsset: {
  select: {
    id: true,
    type: true,
    url: true,
    originalName: true,
    mimeType: true,
    width: true,
    height: true,
    alt: true,
    enabled: true,
    deletedAt: true,
  },
},

  advantages: {
    where: {
      asset: {
        is: {
          type: MediaAssetType.IMAGE,
          enabled: true,
          deletedAt: null,
        },
      },
    },

    orderBy: [
      {
        sortOrder: "asc" as const,
      },
      {
        createdAt: "asc" as const,
      },
    ],

    select: {
      id: true,
      title: true,
      sortOrder: true,

      asset: {
        select: {
          id: true,
          url: true,
          width: true,
          height: true,
          alt: true,
        },
      },
    },
  },

  applications: {
    where: {
      asset: {
        is: {
          type: MediaAssetType.IMAGE,
          enabled: true,
          deletedAt: null,
        },
      },
    },

    orderBy: [
      {
        sortOrder: "asc" as const,
      },
      {
        createdAt: "asc" as const,
      },
    ],

    select: {
      id: true,
      title: true,
      sortOrder: true,

      asset: {
        select: {
          id: true,
          url: true,
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
      enabled: true,
      deletedAt: true,
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

  const coverImage =
    product.coverImageAsset &&
    product.coverImageAsset.type ===
      MediaAssetType.IMAGE &&
    product.coverImageAsset.enabled &&
    product.coverImageAsset.deletedAt === null
      ? {
          id: product.coverImageAsset.id,
          url: product.coverImageAsset.url,
          originalName:
            product.coverImageAsset.originalName,
          mimeType:
            product.coverImageAsset.mimeType,
          width:
            product.coverImageAsset.width,
          height:
            product.coverImageAsset.height,
          alt:
            product.coverImageAsset.alt,
        }
      : null;

  const introBackgroundImage =
  product.introBackgroundImageAsset &&
  product.introBackgroundImageAsset.type ===
    MediaAssetType.IMAGE &&
  product.introBackgroundImageAsset.enabled &&
  product.introBackgroundImageAsset.deletedAt === null
    ? {
        id:
          product.introBackgroundImageAsset.id,

        url:
          product.introBackgroundImageAsset.url,

        originalName:
          product.introBackgroundImageAsset.originalName,

        mimeType:
          product.introBackgroundImageAsset.mimeType,

        width:
          product.introBackgroundImageAsset.width,

        height:
          product.introBackgroundImageAsset.height,

        alt:
          product.introBackgroundImageAsset.alt,
      }
    : null;

  const detailPdf =
    product.detailPdfAsset &&
    product.detailPdfAsset.type ===
      MediaAssetType.PDF &&
    product.detailPdfAsset.enabled &&
    product.detailPdfAsset.deletedAt === null
      ? {
          id:
            product.detailPdfAsset.id,
          originalName:
            product.detailPdfAsset.originalName,
          filename:
            product.detailPdfAsset.filename,
          mimeType:
            product.detailPdfAsset.mimeType,
          size:
            product.detailPdfAsset.size,
          downloadUrl:
            `/api/downloads/${product.detailPdfAsset.id}`,
        }
      : null;

  return {
    id: product.id,
    locale: product.locale,
    name: product.name,
    slug: product.slug,
    seriesName: product.seriesName,

    category: {
      primary:
        product.secondaryCategory.parent,

      secondary: {
        id:
          product.secondaryCategory.id,
        name:
          product.secondaryCategory.name,
        slug:
          product.secondaryCategory.slug,
      },
    },

    summaryParagraphs:
      product.summaryParagraphs,

    highlights:
      product.highlights,

    introductionParagraphs:
      product.introductionParagraphs,

    coverImage,
    introBackgroundImage,

    advantages:
      product.advantages.map((item) => ({
        id: item.id,
        title: item.title,
        sortOrder: item.sortOrder,
        image: item.asset,
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

    applications:
      product.applications.map((item) => ({
        id: item.id,
        title: item.title,
        sortOrder: item.sortOrder,
        image: item.asset,
      })),

    detailPdf,

    publishedAt:
      product.publishedAt,

    createdAt:
      product.createdAt,

    updatedAt:
      product.updatedAt,

    detailUrl:
      `/${product.locale}/products/${product.slug}`,
  };
}

/**
 * 前台产品详情
 *
 * GET /api/products/:slug?locale=zh
 * GET /api/products/:slug?locale=en
 */
export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const query = querySchema.parse(
      Object.fromEntries(
        request.nextUrl.searchParams,
      ),
    );

    const { slug } = await context.params;

    const normalizedSlug =
      decodeURIComponent(slug).trim();

    if (!normalizedSlug) {
      throw new ApiError(
        "NOT_FOUND",
        "产品不存在",
        404,
      );
    }

    const locale =
      query.locale as ProductLocale;

    const data = await withCache(
      "products",
      { slug: normalizedSlug, locale },
      async () => {
        const product =
          await prisma.product.findFirst({
            where: {
              slug: normalizedSlug,
              locale,
              status: ProductStatus.PUBLISHED,
              deletedAt: null,

              secondaryCategory: {
                is: {
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
            },

            select: productDetailSelect,
          });

        if (!product) {
          throw new ApiError(
            "NOT_FOUND",
            "当前语言下的产品不存在或暂未发布",
            404,
          );
        }

        return formatProductDetail(product);
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