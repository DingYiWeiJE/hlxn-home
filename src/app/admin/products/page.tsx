"use client";

import {
  ChevronDown,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Edit3,
  Trash2,
  ImageIcon,
  Languages,
  FileText,
  FolderTree,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DataTable,
  type DataTableColumn,
  type DataTablePaginationProps,
} from "@/components/admin/DataTable";

type ProductLocale = "zh" | "en";

type ProductStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "OFFLINE";

type ProductItem = {
  id: string;
  locale: ProductLocale;
  name: string;
  slug: string;
  seriesName: string | null;
  status: ProductStatus;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  category: {
    primary: {
      id: string;
      name: string;
      slug: string;
    } | null;

    secondary: {
      id: string;
      name: string;
      slug: string;
    };
  };

  coverImage: {
    id: string;
    url: string;
    originalName: string | null;
    width: number | null;
    height: number | null;
    alt: string | null;
  } | null;

  detailPdf: {
    id: string;
    originalName: string | null;
    size: number;
    downloadUrl: string;
  } | null;

  counts: {
    advantages: number;
    applications: number;
  };
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type CategoryLevel = "LEVEL_ONE" | "LEVEL_TWO";

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

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "zh-CN",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

function getStatusLabel(status: ProductStatus) {
  if (status === "PUBLISHED") {
    return "已发布";
  }

  if (status === "OFFLINE") {
    return "已下线";
  }

  return "草稿";
}

function getStatusClassName(status: ProductStatus) {
  if (status === "PUBLISHED") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "OFFLINE") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-amber-50 text-amber-700";
}

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
    useState<any[]>([]);

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

  const columns: DataTableColumn<ProductItem>[] =
    useMemo(
      () => [
        {
          key: "product",
          label: "产品",
          render: (product) => (
            <div className="flex min-w-[280px] items-center gap-4">
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {product.coverImage ? (
                  <Image
                    src={product.coverImage.url}
                    alt={
                      product.coverImage.alt ||
                      product.name
                    }
                    fill
                    unoptimized
                    sizes="80px"
                    className="object-contain p-1.5"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="block truncate text-sm font-semibold text-slate-950 transition hover:text-blue-600"
                >
                  {product.name}
                </Link>

                {product.seriesName ? (
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {product.seriesName}
                  </p>
                ) : null}

                <p className="mt-1 truncate font-mono text-xs text-slate-400">
                  {product.slug}
                </p>
              </div>
            </div>
          ),
        },
        {
          key: "locale",
          label: "语言",
          render: (product) => (
            <span
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                product.locale === "zh"
                  ? "bg-red-50 text-red-700"
                  : "bg-blue-50 text-blue-700",
              ].join(" ")}
            >
              <Languages className="h-3.5 w-3.5" />

              {product.locale === "zh"
                ? "中文"
                : "英文"}
            </span>
          ),
        },
        {
          key: "category",
          label: "分类",
          render: (product) => (
            <div className="min-w-[180px] text-sm">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <FolderTree className="h-4 w-4 text-slate-400" />

                {product.category.primary
                  ?.name ?? "—"}
              </div>

              <p className="mt-1 pl-5 text-xs text-slate-500">
                {product.category.secondary.name}
              </p>
            </div>
          ),
        },
        {
          key: "content",
          label: "内容",
          render: (product) => (
            <div className="space-y-1 text-xs text-slate-500">
              <p>
                产品优势：
                {product.counts.advantages}
              </p>

              <p>
                应用场景：
                {product.counts.applications}
              </p>
            </div>
          ),
        },
        {
          key: "pdf",
          label: "PDF",
          render: (product) =>
            product.detailPdf ? (
              <div className="min-w-[150px]">
                <div className="flex items-center gap-1.5 text-sm font-medium text-violet-700">
                  <FileText className="h-4 w-4" />
                  已上传
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {formatFileSize(
                    product.detailPdf.size,
                  )}
                </p>
              </div>
            ) : (
              <span className="text-sm text-slate-400">
                未上传
              </span>
            ),
        },
        {
          key: "status",
          label: "状态",
          render: (product) => (
            <span
              className={[
                "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                getStatusClassName(
                  product.status,
                ),
              ].join(" ")}
            >
              {getStatusLabel(product.status)}
            </span>
          ),
        },
        {
          key: "updatedAt",
          label: "更新时间",
          render: (product) => (
            <div className="min-w-[150px] text-xs text-slate-500">
              {formatDate(product.updatedAt)}
            </div>
          ),
        },
        {
          key: "actions",
          label: "操作",
          className: "px-5 py-4 text-right",
          render: (product) => (
            <div className="flex justify-end gap-2">
              <Link
                href={`/admin/products/${product.id}/edit`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                aria-label={`编辑 ${product.name}`}
              >
                <Edit3 className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={() =>
                  void handleDelete(product)
                }
                disabled={
                  deletingId === product.id
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                aria-label={`删除 ${product.name}`}
              >
                {deletingId === product.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ),
        },
      ],
      [deletingId],
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
            className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6"
          >
            <label className="relative block sm:col-span-2 lg:col-span-2">
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

            <div className="flex gap-2 sm:col-span-2 lg:col-span-2 xl:col-span-1">
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
          <DataTable
            data={products}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="暂无符合条件的产品"
            pagination={pagination}
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