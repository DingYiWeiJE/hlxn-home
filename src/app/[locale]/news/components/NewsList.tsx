"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { newsEmitter } from "@/lib/events";

type Locale = "zh" | "en";
type NewsType = "DYNAMIC" | "EVENT";

interface NewsItem {
  id: string;
  title: string;
  image: string | null;
  date: string;
  dateTime: string;
  href: string;
}

interface ApiNewsItem {
  id: string;
  title: string;
  slug: string;
  locale?: Locale;

  publishedAt?: string | null;
  createdAt?: string | null;

  coverImageAsset?: {
    url?: string | null;
  } | null;

  coverImage?:
    | string
    | {
        url?: string | null;
      }
    | null;

  coverImageUrl?: string | null;
}

interface PaginationData {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  pages?: number;
}

interface ApiNewsListData {
  items?: ApiNewsItem[];
  news?: ApiNewsItem[];
  list?: ApiNewsItem[];

  pagination?: PaginationData;
  pageInfo?: PaginationData;
  meta?: PaginationData;

  total?: number;
  totalPages?: number;
}

interface ApiResponse {
  success?: boolean;

  data?:
    | ApiNewsItem[]
    | ApiNewsListData;

  error?: {
    code?: string;
    message?: string;
  };
}

const PAGE_SIZE = 6;

const text = {
  zh: {
    fetchError: "新闻列表获取失败",
    empty: "暂无新闻内容",
    viewNews: "查看新闻",
    viewDetail: "查看详情",
    previous: "上一页",
    next: "下一页",
    currentPage: "当前第",
    pageUnit: "页",
    totalPrefix: "共",
    jumpTo: "跳转至",
    jump: "跳转",
    paginationLabel: "新闻列表分页",
    goToPage: "前往第",
    categoryDynamic: "新闻动态",
    categoryEvent: "展会活动",
  },

  en: {
    fetchError: "Failed to load news",
    empty: "No news available",
    viewNews: "View news",
    viewDetail: "View details",
    previous: "Previous",
    next: "Next",
    currentPage: "Page",
    pageUnit: "",
    totalPrefix: "of",
    jumpTo: "Go to",
    jump: "Go",
    paginationLabel: "News pagination",
    goToPage: "Go to page",
    categoryDynamic: "News & Updates",
    categoryEvent: "Exhibitions & Events",
  },
} satisfies Record<Locale, Record<string, string>>;

export default function NewsList() {
  const params = useParams<{
    locale: string;
  }>();
  const searchParams =
    useSearchParams();

  const locale = normalizeLocale(
    params.locale,
  );

  const labels = text[locale];

  const tabs: Array<{
    type: NewsType;
    label: string;
  }> = [
    {
      type: "DYNAMIC",
      label: labels.categoryDynamic,
    },
    {
      type: "EVENT",
      label: labels.categoryEvent,
    },
  ];

  const initialNewsType: NewsType =
    (searchParams.get(
      "type",
    ) as NewsType) ?? "DYNAMIC";

  const sectionRef =
    useRef<HTMLElement>(null);

  const [newsList, setNewsList] =
    useState<NewsItem[]>([]);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [jumpPage, setJumpPage] =
    useState("1");

  const [totalPages, setTotalPages] =
    useState(1);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [newsType, setNewsType] =
    useState<NewsType>(
      initialNewsType,
    );

  /*
   * 在 /zh/news 和 /en/news 之间切换时，
   * 自动回到第一页。
   */
  useEffect(() => {
    setCurrentPage(1);
    setJumpPage("1");
  }, [locale]);

  /*
   * 切换新闻分类时重置分页。
   */
  useEffect(() => {
    setCurrentPage(1);
    setJumpPage("1");
  }, [newsType]);

  /*
   * 监听导航菜单的事件，切换 tab。
   */
  useEffect(() => {
    const handleChangeNewsType = (
      type: NewsType,
    ) => {
      setNewsType(type);
      setCurrentPage(1);
      setJumpPage("1");

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
    };

    newsEmitter.on(
      "changeNewsType",
      handleChangeNewsType,
    );

    return () => {
      newsEmitter.off(
        "changeNewsType",
        handleChangeNewsType,
      );
    };
  }, []);

  /*
   * 根据当前路由语言、分类及页码请求真实新闻。
   */
  useEffect(() => {
    const controller =
      new AbortController();

    async function fetchNewsList() {
      setIsLoading(true);
      setError("");

      try {
        const query =
          new URLSearchParams({
            locale,
            newsType,
            page: String(
              currentPage,
            ),
            pageSize: String(
              PAGE_SIZE,
            ),
          });

        const response =
          await fetch(
            `/api/news?${query.toString()}`,
            {
              method: "GET",
              cache: "no-store",
              signal:
                controller.signal,
            },
          );

        const result =
          (await response.json()) as ApiResponse;

        if (
          !response.ok ||
          result.success === false
        ) {
          throw new Error(
            result.error?.message ??
              labels.fetchError,
          );
        }

        const parsed =
          parseNewsListResponse(
            result.data,
          );

        /*
         * 当前页超过总页数时，
         * 自动回到最后一个有效页。
         */
        if (
          currentPage >
          parsed.totalPages
        ) {
          setCurrentPage(
            parsed.totalPages,
          );

          setJumpPage(
            String(
              parsed.totalPages,
            ),
          );

          return;
        }

        setNewsList(
          parsed.items.map(
            (item) =>
              normalizeNewsItem(
                item,
                locale,
              ),
          ),
        );

        setTotalPages(
          parsed.totalPages,
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
          "获取新闻列表失败：",
          requestError,
        );

        setNewsList([]);
        setTotalPages(1);

        setError(
          requestError instanceof
            Error
            ? requestError.message
            : labels.fetchError,
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    void fetchNewsList();

    return () => {
      controller.abort();
    };
  }, [
    locale,
    newsType,
    currentPage,
    labels.fetchError,
  ]);

  function changePage(
    page: number,
  ) {
    const nextPage = Math.min(
      Math.max(
        Math.trunc(page),
        1,
      ),
      totalPages,
    );

    setCurrentPage(nextPage);
    setJumpPage(
      String(nextPage),
    );

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

  function handleJumpPage() {
    const page =
      Number(jumpPage);

    if (
      !Number.isFinite(page)
    ) {
      setJumpPage(
        String(currentPage),
      );

      return;
    }

    changePage(page);
  }

  return (
    <section
      ref={sectionRef}
      className="w-full scroll-mt-24 bg-white py-10 sm:py-12 lg:py-16"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-6 lg:px-8">
        <div className="mb-8 flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.type}
              type="button"
              onClick={() => {
                setNewsType(tab.type);
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
              }}
              className={[
                "px-6 py-3 font-medium text-base transition-colors border-b-2 -mb-px",
                newsType === tab.type
                  ? "text-[#2463c5] border-[#2463c5]"
                  : "text-slate-600 border-transparent hover:text-slate-900",
              ].join(" ")}
              aria-current={
                newsType === tab.type
                  ? "page"
                  : undefined
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <NewsListSkeleton />
        ) : error ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 text-center text-red-700">
            {error}
          </div>
        ) : newsList.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {newsList.map(
              (item) => (
                <article
                  key={item.id}
                  className="
                    group
                    flex
                    h-full
                    flex-col
                    overflow-hidden
                    rounded-xl
                    border
                    border-slate-200/80
                    bg-white
                    shadow-[0_3px_14px_rgba(15,23,42,0.10)]
                    transition
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-[0_14px_30px_rgba(15,23,42,0.14)]
                  "
                >
                  <Link
                    href={item.href}
                    aria-label={`${labels.viewNews}：${item.title}`}
                    className="relative block aspect-[16/10] overflow-hidden bg-slate-100"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        unoptimized={shouldBypassImageOptimizer(
                          item.image,
                        )}
                        sizes="
                          (max-width: 639px) 100vw,
                          (max-width: 1279px) 50vw,
                          33vw
                        "
                        className="
                          object-cover
                          transition
                          duration-500
                          group-hover:scale-105
                        "
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
                        HANLY NEWS
                      </div>
                    )}

                    <div
                      aria-hidden="true"
                      className="
                        pointer-events-none
                        absolute
                        inset-0
                        bg-gradient-to-t
                        from-black/15
                        to-transparent
                        opacity-0
                        transition-opacity
                        group-hover:opacity-100
                      "
                    />
                  </Link>

                  <div className="flex flex-1 flex-col px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
                    <h2
                      className="
                        line-clamp-2
                        text-[3rem]
                        font-bold
                        leading-[1.65]
                        transition-colors
                        group-hover:text-[#2463c5]
                      "
                    >
                      <Link
                        href={
                          item.href
                        }
                      >
                        {item.title}
                      </Link>
                    </h2>

                    <div className="mt-auto flex items-center justify-between gap-4 pt-5">
                      <time
                        dateTime={
                          item.dateTime ||
                          undefined
                        }
                        className="text-sm text-slate-400 sm:text-base"
                      >
                        {item.date}
                      </time>

                      <Link
                        href={
                          item.href
                        }
                        aria-label={`${labels.viewDetail}：${item.title}`}
                        className="
                          flex
                          shrink-0
                          items-center
                          gap-1
                          text-sm
                          font-medium
                          text-[#2463c5]
                          transition-transform
                          hover:translate-x-1
                        "
                      >
                        {
                          labels.viewDetail
                        }

                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          aria-hidden="true"
                          className="h-4 w-4"
                        >
                          <path
                            d="M4 10h11m-4-4 4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        ) : (
          <div
            className="
              flex
              min-h-64
              items-center
              justify-center
              rounded-2xl
              border
              border-dashed
              border-slate-300
              bg-slate-50
              px-6
              text-center
              text-slate-500
            "
          >
            {labels.empty}
          </div>
        )}

        {!isLoading &&
          !error &&
          totalPages > 1 && (
            <nav
              aria-label={
                labels.paginationLabel
              }
              className="
                mt-10
                flex
                flex-col
                items-center
                justify-center
                gap-5
                sm:mt-12
                lg:flex-row
              "
            >
              <p className="text-sm text-slate-500 sm:text-base">
                {
                  labels.currentPage
                }

                <span className="mx-1 font-semibold text-slate-900">
                  {currentPage}
                </span>

                {
                  labels.pageUnit
                }

                <span className="mx-1">
                  {
                    labels.totalPrefix
                  }
                </span>

                <span className="mx-1 font-semibold text-slate-900">
                  {totalPages}
                </span>

                {
                  labels.pageUnit
                }
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={
                    currentPage ===
                    1
                  }
                  onClick={() =>
                    changePage(
                      currentPage -
                        1,
                    )
                  }
                  className="
                    flex
                    h-11
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-sm
                    text-slate-700
                    transition
                    hover:border-[#2463c5]
                    hover:text-[#2463c5]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  {
                    labels.previous
                  }
                </button>

                {Array.from(
                  {
                    length:
                      totalPages,
                  },
                  (_, index) =>
                    index + 1,
                ).map((page) => {
                  const isCurrent =
                    page ===
                    currentPage;

                  return (
                    <button
                      key={page}
                      type="button"
                      aria-current={
                        isCurrent
                          ? "page"
                          : undefined
                      }
                      aria-label={`${labels.goToPage} ${page}`}
                      onClick={() =>
                        changePage(
                          page,
                        )
                      }
                      className={[
                        "flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 font-medium transition",
                        isCurrent
                          ? "border-[#087fb8] bg-[#087fb8] text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-[#2463c5] hover:text-[#2463c5]",
                      ].join(
                        " ",
                      )}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    changePage(
                      currentPage +
                        1,
                    )
                  }
                  className="
                    flex
                    h-11
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-sm
                    text-slate-700
                    transition
                    hover:border-[#2463c5]
                    hover:text-[#2463c5]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  {labels.next}
                </button>
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <label
                  htmlFor="news-jump-page"
                  className="text-sm text-slate-600 sm:text-base"
                >
                  {labels.jumpTo}
                </label>

                <input
                  id="news-jump-page"
                  type="number"
                  min={1}
                  max={
                    totalPages
                  }
                  value={
                    jumpPage
                  }
                  onChange={(
                    event,
                  ) =>
                    setJumpPage(
                      event
                        .target
                        .value,
                    )
                  }
                  onKeyDown={(
                    event,
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleJumpPage();
                    }
                  }}
                  className="
                    h-11
                    w-20
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-3
                    text-center
                    text-slate-800
                    outline-none
                    transition
                    focus:border-[#2463c5]
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />

                <span className="text-sm text-slate-600 sm:text-base">
                  {
                    labels.pageUnit
                  }
                </span>

                <button
                  type="button"
                  onClick={
                    handleJumpPage
                  }
                  className="
                    h-11
                    rounded-lg
                    bg-slate-900
                    px-4
                    text-sm
                    font-medium
                    text-white
                    transition
                    hover:bg-[#2463c5]
                  "
                >
                  {labels.jump}
                </button>
              </div>
            </nav>
          )}
      </div>
    </section>
  );
}

function normalizeLocale(
  value: string | undefined,
): Locale {
  return value === "en"
    ? "en"
    : "zh";
}

function parseNewsListResponse(
  data:
    | ApiNewsItem[]
    | ApiNewsListData
    | undefined,
): {
  items: ApiNewsItem[];
  totalPages: number;
} {
  if (Array.isArray(data)) {
    return {
      items: data,
      totalPages: Math.max(
        1,
        Math.ceil(
          data.length /
            PAGE_SIZE,
        ),
      ),
    };
  }

  if (!data) {
    return {
      items: [],
      totalPages: 1,
    };
  }

  const items =
    data.items ??
    data.news ??
    data.list ??
    [];

  const pagination =
    data.pagination ??
    data.pageInfo ??
    data.meta;

  const total =
    pagination?.total ??
    data.total ??
    items.length;

  const calculatedTotalPages =
    pagination?.totalPages ??
    pagination?.pages ??
    data.totalPages ??
    Math.ceil(
      total / PAGE_SIZE,
    );

  return {
    items,
    totalPages: Math.max(
      1,
      calculatedTotalPages,
    ),
  };
}

function normalizeNewsItem(
  item: ApiNewsItem,
  locale: Locale,
): NewsItem {
  const rawDate =
    item.publishedAt ??
    item.createdAt ??
    "";

  return {
    id: item.id,
    title: item.title,
    image:
      resolveCoverImage(
        item,
      ),
    date:
      formatNewsDate(
        rawDate,
      ),
    dateTime: rawDate,
    href: `/${locale}/news/${item.slug}`,
  };
}

function resolveCoverImage(
  item: ApiNewsItem,
): string | null {
  const legacyCover =
    typeof item.coverImage ===
    "string"
      ? item.coverImage
      : item.coverImage?.url;

  const url =
    item.coverImageAsset
      ?.url ??
    item.coverImageUrl ??
    legacyCover ??
    null;

  if (
    !url ||
    typeof url !== "string"
  ) {
    return null;
  }

  const trimmed =
    url.trim();

  return trimmed || null;
}

function formatNewsDate(
  value: string,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value.slice(
      0,
      10,
    );
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function NewsListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({
        length: PAGE_SIZE,
      }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="aspect-[16/10] animate-pulse bg-slate-200" />

          <div className="space-y-4 p-5 sm:p-6">
            <div className="h-5 animate-pulse rounded bg-slate-200" />

            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />

            <div className="mt-6 h-4 w-24 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function shouldBypassImageOptimizer(
  imageUrl: string,
): boolean {
  return (
    imageUrl.startsWith(
      "/media/",
    ) ||
    imageUrl.startsWith(
      "/api/media/",
    ) ||
    imageUrl.startsWith(
      "/uploads/",
    )
  );
}