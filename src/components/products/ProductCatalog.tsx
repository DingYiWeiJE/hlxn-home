import { cache } from "react";
import {
  CategoryLevel,
  ProductLocale,
  ProductStatus,
} from "@prisma/client";

import ProductCatalogClient from "./ProductCatalogClient";
import { buildMediaUrl } from "@/lib/media/asset-url";
import { prisma } from "@/lib/prisma";

type ProductCatalogLocale = "zh" | "en";

type Props = {
  locale: string;
};

function normalizeLocale(value: string | undefined): ProductCatalogLocale {
  return value === "en" ? "en" : "zh";
}

function pickCategoryName(
  category: { name: string; nameEn: string },
  locale: ProductCatalogLocale,
) {
  if (locale === "en") {
    return category.nameEn.trim() || category.name;
  }

  return category.name;
}

/**
 * 直接查库获取当前 locale 下的产品与分类。
 *
 * 用 React.cache 包一层做请求级去重：
 * 开发环境下 Next.js 会在同一请求里对 Server Component 做两次渲染（Strict Mode），
 * 若两次渲染各自访问数据源，可能跨越一次后台编辑，
 * 导致 SSR 输出的 HTML 与提供给 hydration 的 RSC payload 拿到不同的数据快照，
 * 从而触发 hydration mismatch。cache() 会让两次调用共享同一个 Promise。
 *
 * 同时直接使用 prisma 查询，绕过 `/api/*` 路由上的应用级 in-memory 缓存 —
 * 该缓存可能被 admin 编辑触发的 `clearCacheByNamespace` 中途清空，
 * 从而让同一请求内两次读取观察到不同快照。
 */
const loadCatalogData = cache(async (locale: ProductCatalogLocale) => {
  const [primaryCategoryRows, secondaryCategoryRows, productRows] =
    await prisma.$transaction([
      prisma.category.findMany({
        where: {
          level: CategoryLevel.LEVEL_ONE,
          enabled: true,
          deletedAt: null,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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
                  locale: locale as ProductLocale,
                  status: ProductStatus.PUBLISHED,
                  deletedAt: null,
                },
              },
            },
          },
        },
      }),

      prisma.product.findMany({
        where: {
          locale: locale as ProductLocale,
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
        take: 100,
        orderBy: [
          { sortOrder: "asc" },
          { publishedAt: "desc" },
          { createdAt: "desc" },
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
    ]);

  const primaryCategories = primaryCategoryRows
    .map((category) => ({
      id: category.id,
      name: pickCategoryName(category, locale),
      nameZh: category.name,
      nameEn: category.nameEn,
      slug: category.slug,
      sortOrder: category.sortOrder,
      secondaryCategoryCount: category._count.children,
    }))
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        (locale === "en"
          ? (a.nameEn?.trim() || a.name).localeCompare(
              b.nameEn?.trim() || b.name,
            )
          : (a.nameZh?.trim() || a.name).localeCompare(
              b.nameZh?.trim() || b.name,
            )),
    );

  const secondaryCategories = secondaryCategoryRows.map((category) => ({
    id: category.id,
    name: pickCategoryName(category, locale),
    nameZh: category.name,
    nameEn: category.nameEn,
    slug: category.slug,
    parentId: category.parentId!,
    sortOrder: category.sortOrder,
    primaryCategory: {
      id: category.parent!.id,
      name: pickCategoryName(category.parent!, locale),
      nameZh: category.parent!.name,
      nameEn: category.parent!.nameEn,
      slug: category.parent!.slug,
    },
    publishedProductCount: category._count.products,
  }));

  const allProducts = productRows.map((item) => ({
    id: item.id,
    locale: item.locale as ProductCatalogLocale,
    name: item.name,
    slug: item.slug,
    seriesName: item.seriesName,
    summaryParagraphs: item.summaryParagraphs,
    highlights: item.highlights,
    coverImage: item.coverImageAsset
      ? {
          id: item.coverImageAsset.id,
          url: buildMediaUrl(item.coverImageAsset.relativePath),
          width: item.coverImageAsset.width,
          height: item.coverImageAsset.height,
          alt: item.coverImageAsset.alt,
        }
      : null,
    category: {
      primary: {
        id: item.secondaryCategory.parent!.id,
        name: pickCategoryName(item.secondaryCategory.parent!, locale),
        slug: item.secondaryCategory.parent!.slug,
      },
      secondary: {
        id: item.secondaryCategory.id,
        name: pickCategoryName(item.secondaryCategory, locale),
        slug: item.secondaryCategory.slug,
      },
    },
    publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
    detailUrl: `/${item.locale}/products/${item.slug}`,
  }));

  return { primaryCategories, secondaryCategories, allProducts };
});

export default async function ProductCatalog({ locale }: Props) {
  const normalizedLocale = normalizeLocale(locale);

  let data: Awaited<ReturnType<typeof loadCatalogData>>;
  try {
    data = await loadCatalogData(normalizedLocale);
  } catch (error) {
    console.error("产品目录数据加载失败：", error);
    data = {
      primaryCategories: [],
      secondaryCategories: [],
      allProducts: [],
    };
  }

  return (
    <ProductCatalogClient
      locale={normalizedLocale}
      allProducts={data.allProducts}
      primaryCategories={data.primaryCategories}
      secondaryCategories={data.secondaryCategories}
    />
  );
}
