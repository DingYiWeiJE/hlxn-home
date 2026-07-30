"use client";

import {
  ChevronDown,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ProductsTable,
  type ProductItem,
  type ProductLocale,
  type ProductStatus,
  type Pagination,
} from "@/components/admin/ProductsTable";

type CategoryLevel =
  | "LEVEL_ONE"
  | "LEVEL_TWO";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  level: CategoryLevel;
  parentId: string | null;
  parent: {
    id: string;
    name: string;
    slug: string;
  } | null;
  sortOrder: number;
  enabled: boolean;
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors: Record<
      string,
      string[]
    >;
  };
};

type ProductListResponse =
  | {
      success: true;
      data: {
        items: ProductItem[];
        pagination: Pagination;
      };
    }
  | ApiFailure;

type CategoryListResponse =
  | {
      success: true;
      data: {
        items: CategoryItem[];
      };
    }
  | ApiFailure;

type DeleteProductResponse =
  | {
      success: true;
      data: {
        id: string;
        deleted: boolean;
      };
    }
  | ApiFailure;

function getErrorMessage(
  result:
    | ProductListResponse
    | CategoryListResponse
    | DeleteProductResponse,
): string {
  if (!result.success) {
    const firstFieldError =
      Object.values(
        result.error.fieldErrors,
      ).flat()[0];

    return (
      firstFieldError ||
      result.error.message
    );
  }

  return "请求失败，请稍后重试";
}

export default function AdminProductsPage() {
  const [products, setProducts] =
    useState<ProductItem[]>([]);

  const [categories, setCategories] =
    useState<CategoryItem[]>([]);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [
    selectedLocale,
    setSelectedLocale,
  ] = useState<
    "ALL" | ProductLocale
  >("ALL");

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState<
    "ALL" | ProductStatus
  >("ALL");

  const [
    primaryCategoryId,
    setPrimaryCategoryId,
  ] = useState("");

  const [
    secondaryCategoryId,
    setSecondaryCategoryId,
  ] = useState("");

  const [
    keywordInput,
    setKeywordInput,
  ] = useState("");

  const [keyword, setKeyword] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isLoadingCategories,
    setIsLoadingCategories,
  ] = useState(true);

  const [pageError, setPageError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const primaryCategories = useMemo(
    () =>
      categories
        .filter(
          (item) =>
            item.level ===
              "LEVEL_ONE" &&
            item.enabled,
        )
        .sort(
          (a, b) =>
            a.sortOrder -
              b.sortOrder ||
            a.name.localeCompare(
              b.name,
            ),
        ),
    [categories],
  );

  const visibleSecondaryCategories =
    useMemo(
      () =>
        categories
          .filter(
            (item) =>
              item.level ===
                "LEVEL_TWO" &&
              item.enabled &&
              (!primaryCategoryId ||
                item.parentId ===
                  primaryCategoryId),
          )
          .sort(
            (a, b) =>
              a.sortOrder -
                b.sortOrder ||
              a.name.localeCompare(
                b.name,
              ),
          ),
      [
        categories,
        primaryCategoryId,
      ],
    );

  const loadCategories =
    useCallback(async () => {
      setIsLoadingCategories(true);

      try {
        const response = await fetch(
          "/api/admin/categories",
          {
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as CategoryListResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            getErrorMessage(result),
          );
        }

        setCategories(
          result.data.items,
        );
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "产品分类加载失败",
        );
      } finally {
        setIsLoadingCategories(false);
      }
    }, []);

  const loadProducts = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setPageError("");

      try {
        const searchParams =
          new URLSearchParams({
            page: String(page),
            pageSize: "20",
            sort: "createdAt",
            order: "desc",
          });

        if (
          selectedLocale !== "ALL"
        ) {
          searchParams.set(
            "locale",
            selectedLocale,
          );
        }

        if (
          selectedStatus !== "ALL"
        ) {
          searchParams.set(
            "status",
            selectedStatus,
          );
        }

        if (primaryCategoryId) {
          searchParams.set(
            "primaryCategoryId",
            primaryCategoryId,
          );
        }

        if (secondaryCategoryId) {
          searchParams.set(
            "secondaryCategoryId",
            secondaryCategoryId,
          );
        }

        if (keyword.trim()) {
          searchParams.set(
            "keyword",
            keyword.trim(),
          );
        }

        const response = await fetch(
          `/api/admin/products?${searchParams.toString()}`,
          {
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as ProductListResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            getErrorMessage(result),
          );
        }

        setProducts(
          result.data.items,
        );

        setPagination(
          result.data.pagination,
        );
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "产品列表加载失败",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      keyword,
      primaryCategoryId,
      secondaryCategoryId,
      selectedLocale,
      selectedStatus,
    ],
  );

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadProducts(1);
  }, [loadProducts]);

  useEffect(() => {
    if (!secondaryCategoryId) {
      return;
    }

    const secondaryCategory =
      categories.find(
        (item) =>
          item.id ===
          secondaryCategoryId,
      );

    if (
      !secondaryCategory ||
      (primaryCategoryId &&
        secondaryCategory.parentId !==
          primaryCategoryId)
    ) {
      setSecondaryCategoryId("");
    }
  }, [
    categories,
    primaryCategoryId,
    secondaryCategoryId,
  ]);

  async function handleDelete(
    product: ProductItem,
  ) {
    const confirmed =
      window.confirm(
        `确认删除产品“${product.name}”吗？\n\n产品会被软删除并自动下线，素材文件不会被删除。`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);
    setPageError("");

    try {
      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "DELETE",
        },
      );

      const result =
        (await response.json()) as DeleteProductResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          getErrorMessage(result),
        );
      }

      const nextPage =
        products.length === 1 &&
        pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await loadProducts(nextPage);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "产品删除失败",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleSearch(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setKeyword(
      keywordInput.trim(),
    );
  }

  function clearFilters() {
    setSelectedLocale("ALL");
    setSelectedStatus("ALL");
    setPrimaryCategoryId("");
    setSecondaryCategoryId("");
    setKeywordInput("");
    setKeyword("");
  }

  const statistics = useMemo(
    () => ({
      published: products.filter(
        (item) =>
          item.status ===
          "PUBLISHED",
      ).length,

      drafts: products.filter(
        (item) =>
          item.status === "DRAFT",
      ).length,

      chinese: products.filter(
        (item) =>
          item.locale === "zh",
      ).length,

      english: products.filter(
        (item) =>
          item.locale === "en",
      ).length,
    }),
    [products],
  );

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Package className="h-4 w-4" />
            产品内容管理
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            产品管理
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            管理中英文产品内容、分类、封面图、产品优势、应用场景、规格参数和产品 PDF。
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              void loadProducts(
                pagination.page,
              )
            }
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={[
                "h-4 w-4",
                isLoading
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />
            刷新
          </button>

          <Link
            href="/admin/products/create"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            创建产品
          </Link>
        </div>
      </header>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="产品总数"
          value={pagination.total}
          description="符合当前筛选条件"
        />

        <StatCard
          label="本页已发布"
          value={statistics.published}
          description="当前可以在前台展示"
        />

        <StatCard
          label="本页草稿"
          value={statistics.drafts}
          description="仍在编辑中的产品"
        />

        <StatCard
          label="本页中文"
          value={statistics.chinese}
          description="语言为 zh 的产品"
        />

        <StatCard
          label="本页英文"
          value={statistics.english}
          description="语言为 en 的产品"
        />
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <form
            onSubmit={handleSearch}
            className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_160px_170px_220px_220px_auto]"
          >
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={keywordInput}
                onChange={(event) =>
                  setKeywordInput(
                    event.target.value,
                  )
                }
                placeholder="搜索产品名称、系列或 Slug"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <SelectField
              value={selectedLocale}
              onChange={(value) =>
                setSelectedLocale(
                  value as
                    | "ALL"
                    | ProductLocale,
                )
              }
              disabled={false}
            >
              <option value="ALL">
                全部语言
              </option>

              <option value="zh">
                中文
              </option>

              <option value="en">
                英文
              </option>
            </SelectField>

            <SelectField
              value={selectedStatus}
              onChange={(value) =>
                setSelectedStatus(
                  value as
                    | "ALL"
                    | ProductStatus,
                )
              }
              disabled={false}
            >
              <option value="ALL">
                全部状态
              </option>

              <option value="DRAFT">
                草稿
              </option>

              <option value="PUBLISHED">
                已发布
              </option>

              <option value="OFFLINE">
                已下线
              </option>
            </SelectField>

            <SelectField
              value={primaryCategoryId}
              onChange={(value) =>
                setPrimaryCategoryId(
                  value,
                )
              }
              disabled={
                isLoadingCategories
              }
            >
              <option value="">
                全部一级分类
              </option>

              {primaryCategories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ),
              )}
            </SelectField>

            <SelectField
              value={
                secondaryCategoryId
              }
              onChange={(value) =>
                setSecondaryCategoryId(
                  value,
                )
              }
              disabled={
                isLoadingCategories
              }
            >
              <option value="">
                全部二级分类
              </option>

              {visibleSecondaryCategories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ),
              )}
            </SelectField>

            <div className="flex gap-2">
              <button
                type="submit"
                className="h-11 flex-1 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                查询
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                重置
              </button>
            </div>
          </form>
        </div>

        {pageError ? (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        {products.length === 0 && !isLoading ? (
          <div className="flex min-h-96 flex-col items-center justify-center px-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Package className="h-8 w-8" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-800">
              暂无符合条件的产品
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              可以调整筛选条件或创建第一个产品。
            </p>

            <Link
              href="/admin/products/create"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              创建产品
            </Link>
          </div>
        ) : (
          <ProductsTable
            products={products}
            isLoading={isLoading}
            deletingId={deletingId}
            pagination={pagination}
            onDelete={handleDelete}
            onPageChange={loadProducts}
          />
        )}
      </section>
    </div>
  );
}

function SelectField({
  value,
  onChange,
  disabled,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block">
      <select
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </label>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}