"use client";

import {
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ProductLocale = "zh" | "en";

type PrimaryCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  secondaryCategoryCount: number;
};

type SecondaryCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string;
  sortOrder: number;

  primaryCategory: {
    id: string;
    name: string;
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

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ApiFailure = {
  success: false;

  error: {
    code?: string;
    message?: string;
    fieldErrors?: Record<
      string,
      string[]
    >;
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
        pagination: Pagination;
      };
    }
  | ApiFailure;

const PAGE_SIZE = 9;

const labels = {
  zh: {
    title: "产品目录",
    subtitle:
      "探索汉理新能源产品与解决方案",
    allProducts: "全部产品",
    productType: "产品类型",
    allTypes: "全部类型",
    searchPlaceholder:
      "搜索产品名称或系列",
    search: "搜索",
    clear: "清除",
    loading: "正在加载产品...",
    empty: "暂无符合条件的产品",
    emptyDescription:
      "可以尝试更换分类或清除搜索条件。",
    loadFailed: "产品加载失败",
    retry: "重新加载",
    previous: "上一页",
    next: "下一页",
    pagePrefix: "第",
    pageMiddle: "页，共",
    pageSuffix: "页",
    totalPrefix: "共",
    totalSuffix: "个产品",
    viewDetail: "查看产品详情",
    noImage: "暂无产品图片",
  },

  en: {
    title: "Product Catalog",
    subtitle:
      "Explore HANLY new-energy products and solutions",
    allProducts: "All Products",
    productType: "Product Types",
    allTypes: "All Types",
    searchPlaceholder:
      "Search products or series",
    search: "Search",
    clear: "Clear",
    loading: "Loading products...",
    empty: "No matching products",
    emptyDescription:
      "Try another category or clear the search filters.",
    loadFailed:
      "Failed to load products",
    retry: "Retry",
    previous: "Previous",
    next: "Next",
    pagePrefix: "Page",
    pageMiddle: "of",
    pageSuffix: "",
    totalPrefix: "",
    totalSuffix: "products",
    viewDetail:
      "View product details",
    noImage: "No product image",
  },
} satisfies Record<
  ProductLocale,
  Record<string, string>
>;

export default function ProductCatalog() {
  const params = useParams<{
    locale: string;
  }>();

  const locale =
    normalizeLocale(params.locale);

  const text = labels[locale];

  const sectionRef =
    useRef<HTMLElement>(null);

  const [
    primaryCategories,
    setPrimaryCategories,
  ] = useState<
    PrimaryCategory[]
  >([]);

  const [
    secondaryCategories,
    setSecondaryCategories,
  ] = useState<
    SecondaryCategory[]
  >([]);

  const [
    selectedPrimaryCategoryId,
    setSelectedPrimaryCategoryId,
  ] = useState("");

  const [
    selectedSecondaryCategoryId,
    setSelectedSecondaryCategoryId,
  ] = useState("");

  const [products, setProducts] =
    useState<ProductItem[]>([]);

  const [
    pagination,
    setPagination,
  ] = useState<Pagination>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    keywordInput,
    setKeywordInput,
  ] = useState("");

  const [keyword, setKeyword] =
    useState("");

  const [
    isLoadingCategories,
    setIsLoadingCategories,
  ] = useState(true);

  const [
    isLoadingProducts,
    setIsLoadingProducts,
  ] = useState(true);

  const [error, setError] =
    useState("");

  const visibleSecondaryCategories =
    useMemo(() => {
      const filtered =
        selectedPrimaryCategoryId
          ? secondaryCategories.filter(
              (category) =>
                category.parentId ===
                selectedPrimaryCategoryId,
            )
          : secondaryCategories;

      return [...filtered].sort(
        (a, b) =>
          a.sortOrder -
            b.sortOrder ||
          a.name.localeCompare(
            b.name,
          ),
      );
    }, [
      secondaryCategories,
      selectedPrimaryCategoryId,
    ]);

  /*
   * 路由语言切换时，清空筛选并回到第一页。
   */
  useEffect(() => {
    setSelectedPrimaryCategoryId(
      "",
    );

    setSelectedSecondaryCategoryId(
      "",
    );

    setKeywordInput("");
    setKeyword("");
    setCurrentPage(1);
  }, [locale]);

  /*
   * 分类目前没有 locale 字段，
   * 因此直接读取全部启用分类。
   */
  useEffect(() => {
    const controller =
      new AbortController();

    async function loadCategories() {
      setIsLoadingCategories(
        true,
      );

      try {
        const response =
          await fetch(
            "/api/categories",
            {
              method: "GET",
              cache: "no-store",
              signal:
                controller.signal,
            },
          );

        const result =
          (await response.json()) as CategoryResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            getApiErrorMessage(
              result,
              text.loadFailed,
            ),
          );
        }

        setPrimaryCategories(
          [
            ...result.data
              .primaryCategories,
          ].sort(
            (a, b) =>
              a.sortOrder -
                b.sortOrder ||
              a.name.localeCompare(
                b.name,
              ),
          ),
        );

        setSecondaryCategories(
          result.data
            .secondaryCategories,
        );
      } catch (requestError) {
        if (
          requestError instanceof
            Error &&
          requestError.name ===
            "AbortError"
        ) {
          return;
        }

        console.error(
          "产品分类加载失败：",
          requestError,
        );

        setPrimaryCategories([]);
        setSecondaryCategories(
          [],
        );
      } finally {
        if (
          !controller.signal
            .aborted
        ) {
          setIsLoadingCategories(
            false,
          );
        }
      }
    }

    void loadCategories();

    return () => {
      controller.abort();
    };
  }, [text.loadFailed]);

  /*
   * 根据语言、分类、关键词和页码查询产品。
   */
  useEffect(() => {
    const controller =
      new AbortController();

    async function loadProducts() {
      setIsLoadingProducts(true);
      setError("");

      try {
        const query =
          new URLSearchParams({
            locale,
            page: String(
              currentPage,
            ),
            pageSize: String(
              PAGE_SIZE,
            ),
          });

        if (
          selectedPrimaryCategoryId
        ) {
          query.set(
            "primaryCategoryId",
            selectedPrimaryCategoryId,
          );
        }

        if (
          selectedSecondaryCategoryId
        ) {
          query.set(
            "secondaryCategoryId",
            selectedSecondaryCategoryId,
          );
        }

        if (keyword) {
          query.set(
            "keyword",
            keyword,
          );
        }

        const response =
          await fetch(
            `/api/products?${query.toString()}`,
            {
              method: "GET",
              cache: "no-store",
              signal:
                controller.signal,
            },
          );

        const result =
          (await response.json()) as ProductResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            getApiErrorMessage(
              result,
              text.loadFailed,
            ),
          );
        }

        /*
         * 删除产品或切换筛选后，
         * 当前页可能超过新的总页数。
         */
        if (
          currentPage > 1 &&
          result.data.pagination
            .totalPages > 0 &&
          currentPage >
            result.data.pagination
              .totalPages
        ) {
          setCurrentPage(
            result.data.pagination
              .totalPages,
          );

          return;
        }

        setProducts(
          result.data.items,
        );

        setPagination(
          result.data.pagination,
        );
      } catch (requestError) {
        if (
          requestError instanceof
            Error &&
          requestError.name ===
            "AbortError"
        ) {
          return;
        }

        console.error(
          "产品列表加载失败：",
          requestError,
        );

        setProducts([]);

        setPagination({
          page: 1,
          pageSize: PAGE_SIZE,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        });

        setError(
          requestError instanceof
            Error
            ? requestError.message
            : text.loadFailed,
        );
      } finally {
        if (
          !controller.signal
            .aborted
        ) {
          setIsLoadingProducts(
            false,
          );
        }
      }
    }

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [
    currentPage,
    keyword,
    locale,
    selectedPrimaryCategoryId,
    selectedSecondaryCategoryId,
    text.loadFailed,
  ]);

  function selectPrimaryCategory(
    categoryId: string,
  ) {
    setSelectedPrimaryCategoryId(
      categoryId,
    );

    setSelectedSecondaryCategoryId(
      "",
    );

    setCurrentPage(1);
  }

  function selectSecondaryCategory(
    categoryId: string,
  ) {
    setSelectedSecondaryCategoryId(
      categoryId,
    );

    if (categoryId) {
      const category =
        secondaryCategories.find(
          (item) =>
            item.id === categoryId,
        );

      if (category) {
        setSelectedPrimaryCategoryId(
          category.parentId,
        );
      }
    }

    setCurrentPage(1);
  }

  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setKeyword(
      keywordInput.trim(),
    );

    setCurrentPage(1);
  }

  function clearSearch() {
    setKeywordInput("");
    setKeyword("");
    setCurrentPage(1);
  }

  function changePage(
    page: number,
  ) {
    const totalPages = Math.max(
      pagination.totalPages,
      1,
    );

    const nextPage = Math.min(
      Math.max(
        Math.trunc(page),
        1,
      ),
      totalPages,
    );

    setCurrentPage(nextPage);

    window.requestAnimationFrame(
      () => {
        sectionRef.current?.scrollIntoView(
          {
            behavior: "smooth",
            block: "start",
          },
        );
      },
    );
  }

  return (
    <section
      ref={sectionRef}
      className="w-full scroll-mt-20 bg-[#eef8ff] py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#2364c7] sm:text-4xl lg:text-5xl">
            {text.title}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            {text.subtitle}
          </p>
        </header>

        {/* 一级分类 */}
        <div className="-mx-4 mt-8 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mt-10 sm:px-0">
          <div className="flex min-w-max items-center gap-3 sm:min-w-0 sm:flex-wrap sm:justify-center">
            <CategoryButton
              active={
                !selectedPrimaryCategoryId
              }
              onClick={() =>
                selectPrimaryCategory(
                  "",
                )
              }
            >
              {text.allProducts}
            </CategoryButton>

            {primaryCategories.map(
              (category) => (
                <CategoryButton
                  key={category.id}
                  active={
                    selectedPrimaryCategoryId ===
                    category.id
                  }
                  onClick={() =>
                    selectPrimaryCategory(
                      category.id,
                    )
                  }
                >
                  {category.name}
                </CategoryButton>
              ),
            )}
          </div>
        </div>

        {/* 搜索 */}
        <form
          onSubmit={handleSearch}
          className="mx-auto mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={keywordInput}
              onChange={(event) =>
                setKeywordInput(
                  event.target.value,
                )
              }
              maxLength={100}
              placeholder={
                text.searchPlaceholder
              }
              className="h-12 w-full rounded-xl border border-white bg-white pl-11 pr-11 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />

            {keywordInput ? (
              <button
                type="button"
                onClick={clearSearch}
                aria-label={text.clear}
                className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2364c7] px-7 text-sm font-semibold text-white shadow-md transition hover:bg-[#1d54a8]"
          >
            <Search className="h-4 w-4" />
            {text.search}
          </button>
        </form>

        <div className="mt-8 grid gap-6 lg:mt-12 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start">
          {/* 移动端二级分类 */}
          <div className="lg:hidden">
            <label
              htmlFor="mobile-product-category"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {text.productType}
            </label>

            <select
              id="mobile-product-category"
              value={
                selectedSecondaryCategoryId
              }
              onChange={(event) =>
                selectSecondaryCategory(
                  event.target.value,
                )
              }
              disabled={
                isLoadingCategories
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {text.allTypes}
              </option>

              {visibleSecondaryCategories.map(
                (category) => (
                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {
                      category.name
                    }
                  </option>
                ),
              )}
            </select>
          </div>

          {/* 桌面端二级分类 */}
          <aside className="hidden overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm lg:block">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-bold text-slate-900">
                {text.productType}
              </h2>
            </div>

            <div className="max-h-[640px] space-y-1 overflow-y-auto p-3">
              <SecondaryCategoryButton
                active={
                  !selectedSecondaryCategoryId
                }
                onClick={() =>
                  selectSecondaryCategory(
                    "",
                  )
                }
              >
                {text.allTypes}
              </SecondaryCategoryButton>

              {visibleSecondaryCategories.map(
                (category) => (
                  <SecondaryCategoryButton
                    key={
                      category.id
                    }
                    active={
                      selectedSecondaryCategoryId ===
                      category.id
                    }
                    onClick={() =>
                      selectSecondaryCategory(
                        category.id,
                      )
                    }
                  >
                    {category.name}
                  </SecondaryCategoryButton>
                ),
              )}
            </div>
          </aside>

          <main className="min-w-0">
            {!isLoadingProducts &&
            !error ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <p>
                  {text.totalPrefix}{" "}
                  <span className="font-semibold text-slate-900">
                    {
                      pagination.total
                    }
                  </span>{" "}
                  {text.totalSuffix}
                </p>

                {keyword ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    <X className="h-4 w-4" />
                    {text.clear}
                  </button>
                ) : null}
              </div>
            ) : null}

            {isLoadingProducts ? (
              <ProductSkeleton />
            ) : error ? (
              <ErrorState
                message={error}
                retryText={text.retry}
                onRetry={() => {
                  setCurrentPage(
                    (page) =>
                      page === 1
                        ? 2
                        : 1,
                  );

                  window.setTimeout(
                    () =>
                      setCurrentPage(
                        1,
                      ),
                    0,
                  );
                }}
              />
            ) : products.length === 0 ? (
              <EmptyState
                title={text.empty}
                description={
                  text.emptyDescription
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map(
                    (product) => (
                      <ProductCard
                        key={
                          product.id
                        }
                        product={
                          product
                        }
                        locale={
                          locale
                        }
                        detailLabel={
                          text.viewDetail
                        }
                        noImageLabel={
                          text.noImage
                        }
                      />
                    ),
                  )}
                </div>

                {pagination.totalPages >
                1 ? (
                  <PaginationControls
                    pagination={
                      pagination
                    }
                    currentPage={
                      currentPage
                    }
                    onChange={
                      changePage
                    }
                    text={text}
                  />
                ) : null}
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}

function CategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        "min-h-11 whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-semibold shadow-sm transition sm:px-8",
        active
          ? "bg-[#42c86b] text-white shadow-[0_8px_20px_rgba(66,200,107,0.25)]"
          : "bg-white text-slate-700 hover:-translate-y-0.5 hover:text-blue-600 hover:shadow-md",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SecondaryCategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        "block w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition",
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-blue-600",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ProductCard({
  product,
  locale,
  detailLabel,
  noImageLabel,
}: {
  product: ProductItem;
  locale: ProductLocale;
  detailLabel: string;
  noImageLabel: string;
}) {
  const detailUrl =
    product.detailUrl ||
    `/${locale}/products/${encodeURIComponent(
      product.slug,
    )}`;

  return (
    <Link
      href={detailUrl}
      aria-label={`${detailLabel}：${product.name}`}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#f7fafc]">
          {product.coverImage?.url ? (
            <Image
              src={
                product.coverImage
                  .url
              }
              alt={
                product.coverImage
                  .alt ||
                product.name
              }
              fill
              unoptimized
              sizes="
                (max-width: 639px) 100vw,
                (max-width: 1279px) 50vw,
                33vw
              "
              className="object-contain p-6 transition duration-500 group-hover:scale-105 sm:p-8"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-5 text-center text-slate-400">
              <PackageSearch className="h-12 w-12" />

              <p className="mt-3 text-sm font-medium">
                {noImageLabel}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          {product.seriesName ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
              {
                product.seriesName
              }
            </p>
          ) : null}

          <h3 className="line-clamp-2 text-lg font-bold leading-7 text-[#102a43] transition group-hover:text-[#2364c7]">
            {product.name}
          </h3>

          <div className="mt-auto flex items-center justify-between gap-3 pt-5">
            <span className="line-clamp-1 text-xs text-slate-400">
              {
                product.category
                  .secondary.name
              }
            </span>

            <span className="shrink-0 text-sm font-semibold text-[#2364c7]">
              {detailLabel}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({
        length: PAGE_SIZE,
      }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl bg-white shadow-sm"
        >
          <div className="aspect-[4/3] animate-pulse bg-slate-200" />

          <div className="space-y-4 p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />

            <div className="h-6 animate-pulse rounded bg-slate-200" />

            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-white/70 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
        <PackageSearch className="h-8 w-8" />
      </span>

      <h2 className="mt-5 text-lg font-bold text-slate-800">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ErrorState({
  message,
  retryText,
  onRetry,
}: {
  message: string;
  retryText: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 text-center">
      <p className="text-sm font-medium text-red-700">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 h-10 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        {retryText}
      </button>
    </div>
  );
}

function PaginationControls({
  pagination,
  currentPage,
  onChange,
  text,
}: {
  pagination: Pagination;
  currentPage: number;
  onChange: (page: number) => void;
  text: (typeof labels)[ProductLocale];
}) {
  return (
    <nav
      aria-label="Product pagination"
      className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-blue-100 pt-7 sm:flex-row"
    >
      <p className="text-sm text-slate-500">
        {text.pagePrefix}{" "}
        <span className="font-semibold text-slate-900">
          {currentPage}
        </span>{" "}
        {text.pageMiddle}{" "}
        <span className="font-semibold text-slate-900">
          {
            pagination.totalPages
          }
        </span>{" "}
        {text.pageSuffix}
      </p>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <button
          type="button"
          disabled={
            !pagination.hasPreviousPage
          }
          onClick={() =>
            onChange(
              currentPage - 1,
            )
          }
          className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
        >
          <ChevronLeft className="h-4 w-4" />
          {text.previous}
        </button>

        <button
          type="button"
          disabled={
            !pagination.hasNextPage
          }
          onClick={() =>
            onChange(
              currentPage + 1,
            )
          }
          className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-[#2364c7] px-4 text-sm font-semibold text-white transition hover:bg-[#1d54a8] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
        >
          {text.next}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

function normalizeLocale(
  value: string | undefined,
): ProductLocale {
  return value === "en"
    ? "en"
    : "zh";
}

function getApiErrorMessage(
  result:
    | CategoryResponse
    | ProductResponse,
  fallback: string,
): string {
  if (!result.success) {
    const firstFieldError =
      Object.values(
        result.error.fieldErrors ??
          {},
      ).flat()[0];

    return (
      firstFieldError ||
      result.error.message ||
      fallback
    );
  }

  return fallback;
}