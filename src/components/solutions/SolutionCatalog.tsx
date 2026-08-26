"use client";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

type SolutionLocale = "zh" | "en";

type SolutionItem = {
  id: string;
  locale: SolutionLocale;
  name: string;
  slug: string;
  summaryParagraphs: unknown;
  highlights: unknown;
  workingPrincipleBackgroundImage: {
    id: string;
    url: string;
    width: number | null;
    height: number | null;
    alt: string | null;
  } | null;
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

type ApiResponse =
  | {
      success: true;
      data: {
        items: SolutionItem[];
        pagination: Pagination;
      };
    }
  | {
      success: false;
      error: {
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };

const labels = {
  zh: {
    title: "解决方案",
    subtitle: "面向多场景能源系统的工程化解决方案",
    searchPlaceholder: "搜索解决方案",
    search: "搜索",
    clear: "清除",
    empty: "暂无解决方案",
    retry: "重试",
    viewDetail: "查看详情",
    previous: "上一页",
    next: "下一页",
    totalPrefix: "共",
    totalSuffix: "个解决方案",
  },
  en: {
    title: "Solutions",
    subtitle: "Engineered energy solutions for demanding scenarios",
    searchPlaceholder: "Search solutions",
    search: "Search",
    clear: "Clear",
    empty: "No solutions yet",
    retry: "Retry",
    viewDetail: "View details",
    previous: "Previous",
    next: "Next",
    totalPrefix: "",
    totalSuffix: "solutions",
  },
} satisfies Record<SolutionLocale, Record<string, string>>;

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];
}

function getApiErrorMessage(result: ApiResponse, fallback: string): string {
  if (!result.success) {
    const firstFieldError = Object.values(
      result.error.fieldErrors ?? {},
    ).flat()[0];

    return firstFieldError || result.error.message || fallback;
  }

  return fallback;
}

export default function SolutionCatalog({ locale }: { locale: string }) {
  const normalizedLocale: SolutionLocale = locale === "en" ? "en" : "zh";
  const text = labels[normalizedLocale];
  const sectionRef = useRef<HTMLElement | null>(null);

  const [items, setItems] = useState<SolutionItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSolutions = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const searchParams = new URLSearchParams({
        locale: normalizedLocale,
        page: String(currentPage),
        pageSize: "12",
      });

      if (keyword) {
        searchParams.set("keyword", keyword);
      }

      const response = await fetch(`/api/solutions?${searchParams.toString()}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(getApiErrorMessage(result, "Failed to load solutions"));
      }

      setItems(result.data.items);
      setPagination(result.data.pagination);
    } catch (loadError) {
      setItems([]);
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load",
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, keyword, normalizedLocale]);

  useEffect(() => {
    void loadSolutions();
  }, [loadSolutions]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setKeyword(keywordInput.trim());
    setCurrentPage(1);
  }

  function changePage(page: number) {
    setCurrentPage(page);
    window.requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <section
      ref={sectionRef}
      className="scroll-mt-20 bg-[#eef8ff] px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <header className="text-center">
          <h2 className="text-[3rem] font-bold tracking-tight text-[#2364c7]">
            {text.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            {text.subtitle}
          </p>
        </header>

        <form
          onSubmit={handleSearch}
          className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              maxLength={100}
              placeholder={text.searchPlaceholder}
              className="h-12 w-full rounded-xl border border-white bg-white pl-11 pr-11 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
            {keywordInput ? (
              <button
                type="button"
                onClick={() => {
                  setKeywordInput("");
                  setKeyword("");
                  setCurrentPage(1);
                }}
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

        <div className="mt-10">
          {isLoading ? (
            <SolutionSkeleton />
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center text-sm text-red-700">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void loadSolutions()}
                className="mt-5 h-10 rounded-xl bg-red-600 px-5 font-semibold text-white"
              >
                {text.retry}
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 px-6 py-20 text-center text-slate-500">
              {text.empty}
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm text-slate-500">
                {text.totalPrefix}{" "}
                <span className="font-semibold text-slate-950">
                  {pagination.total}
                </span>{" "}
                {text.totalSuffix}
              </p>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <SolutionCard
                    key={item.id}
                    item={item}
                    viewDetail={text.viewDetail}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {pagination.totalPages > 1 ? (
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-blue-100 pt-7 sm:flex-row">
            <p className="text-sm text-slate-500">
              {currentPage} / {pagination.totalPages}
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => changePage(currentPage - 1)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-blue-300 disabled:opacity-40 sm:flex-none"
              >
                <ChevronLeft className="h-4 w-4" />
                {text.previous}
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => changePage(currentPage + 1)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-[#2364c7] px-4 text-sm font-semibold text-white transition hover:bg-[#1d54a8] disabled:opacity-40 sm:flex-none"
              >
                {text.next}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SolutionCard({
  item,
  viewDetail,
}: {
  item: SolutionItem;
  viewDetail: string;
}) {
  const summary = toStringArray(item.summaryParagraphs);
  const highlights = toStringArray(item.highlights);

  return (
    <Link
      href={item.detailUrl}
      className="group block h-full rounded-2xl [content-visibility:auto] [contain-intrinsic-size:460px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
        <div className="relative aspect-[16/10] overflow-hidden bg-[#dceef8]">
          {item.workingPrincipleBackgroundImage?.url ? (
            <Image
              src={item.workingPrincipleBackgroundImage.url}
              alt={item.workingPrincipleBackgroundImage.alt || item.name}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : null}
          <div className="absolute inset-0 bg-slate-950/20" />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 text-xl font-bold leading-7 text-[#102a43] transition group-hover:text-[#2364c7]">
            {item.name}
          </h3>
          {summary.length > 0 ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
              {summary[0]}
            </p>
          ) : null}
          {highlights.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {highlights.slice(0, 3).map((highlight) => (
                <span
                  key={highlight}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                >
                  {highlight}
                </span>
              ))}
            </div>
          ) : null}
          <span className="mt-auto pt-5 text-sm font-semibold text-[#2364c7]">
            {viewDetail}
          </span>
        </div>
      </article>
    </Link>
  );
}

function SolutionSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="aspect-[16/10] animate-pulse bg-slate-200" />
          <div className="space-y-4 p-5">
            <div className="h-6 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
