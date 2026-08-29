import ProductCatalogClient from "./ProductCatalogClient";

type ProductLocale = "zh" | "en";

type PrimaryCategory = {
  id: string;
  name: string;
  nameZh: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  secondaryCategoryCount: number;
};

type SecondaryCategory = {
  id: string;
  name: string;
  nameZh: string;
  nameEn: string;
  slug: string;
  parentId: string;
  sortOrder: number;

  primaryCategory: {
    id: string;
    name: string;
    nameZh: string;
    nameEn: string;
    slug: string;
  };

  publishedProductCount: number;
};

type ProductCoverImage = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
};

type ProductItem = {
  id: string;
  locale: ProductLocale;
  name: string;
  slug: string;
  seriesName: string | null;
  summaryParagraphs: unknown;
  highlights: unknown;
  coverImage: ProductCoverImage | null;

  category: {
    primary: {
      id: string;
      name: string;
      slug: string;
    };

    secondary: {
      id: string;
      name: string;
      slug: string;
    };
  };

  publishedAt: string | null;
  detailUrl: string;
};

type ApiFailure = {
  success: false;

  error: {
    code?: string;
    message?: string;
    fieldErrors?: Record<string, string[]>;
  };
};

type CategoryResponse =
  | {
      success: true;

      data: {
        primaryCategories: PrimaryCategory[];
        secondaryCategories: SecondaryCategory[];
      };
    }
  | ApiFailure;

type ProductResponse =
  | {
      success: true;

      data: {
        locale: ProductLocale;
        items: ProductItem[];
        pagination: {
          page: number;
          pageSize: number;
          total: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
        };
      };
    }
  | ApiFailure;

type Props = {
  locale: string;
};

function normalizeLocale(value: string | undefined): ProductLocale {
  return value === "en" ? "en" : "zh";
}

function getCategoryTitle(
  category: {
    name: string;
    nameZh?: string;
    nameEn?: string;
  },
  locale: ProductLocale
) {
  if (locale === "en") {
    return category.nameEn?.trim() || category.name;
  }

  return category.nameZh?.trim() || category.name;
}

export default async function ProductCatalog({ locale }: Props) {
  const normalizedLocale = normalizeLocale(locale);

  // 服务端一次性获取所有产品和分类
  const [categoriesResult, productsResult] = await Promise.all([
    fetchCategories(normalizedLocale),
    fetchAllProducts(normalizedLocale),
  ]);

  // 处理分类数据
  const primaryCategories =
    categoriesResult.success
      ? [...categoriesResult.data.primaryCategories].sort(
          (a, b) =>
            a.sortOrder - b.sortOrder ||
            getCategoryTitle(a, normalizedLocale).localeCompare(
              getCategoryTitle(b, normalizedLocale)
            )
        )
      : [];

  const secondaryCategories = categoriesResult.success
    ? categoriesResult.data.secondaryCategories
    : [];

  // 处理产品数据
  const allProducts = productsResult.success ? productsResult.data.items : [];

  return (
    <ProductCatalogClient
      locale={normalizedLocale}
      allProducts={allProducts}
      primaryCategories={primaryCategories}
      secondaryCategories={secondaryCategories}
    />
  );
}

async function fetchCategories(
  locale: ProductLocale
): Promise<CategoryResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

    const response = await fetch(
      `${baseUrl}/api/categories?${new URLSearchParams({
        locale,
      }).toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const result = (await response.json()) as CategoryResponse;

    if (!response.ok || !result.success) {
      console.error("分类数据加载失败：", result);
      return {
        success: false,
        error: {
          message: "Failed to load categories",
        },
      };
    }

    return result;
  } catch (error) {
    console.error("分类数据请求异常：", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

async function fetchAllProducts(
  locale: ProductLocale
): Promise<ProductResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

    // 获取所有产品（不分页，pageSize设置为一个足够大的数）
    const response = await fetch(
      `${baseUrl}/api/products?${new URLSearchParams({
        locale,
        page: "1",
        pageSize: "100", // 获取所有产品
      }).toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const result = (await response.json()) as ProductResponse;

    if (!response.ok || !result.success) {
      console.error("产品数据加载失败：", result);
      return {
        success: false,
        error: {
          message: "Failed to load products",
        },
      };
    }

    return result;
  } catch (error) {
    console.error("产品数据请求异常：", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
