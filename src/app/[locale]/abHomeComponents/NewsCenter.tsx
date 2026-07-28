import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

type Locale = "zh" | "en";

type ApiNewsItem = {
  id: string;
  title: string;
  slug: string;
  locale?: Locale;

  publishedAt?: string | null;
  createdAt?: string | null;

  coverImageAsset?: {
    id?: string;
    url?: string | null;
  } | null;

  coverImage?:
    | string
    | {
        url?: string | null;
      }
    | null;

  coverImageUrl?: string | null;
};

type ApiNewsListData = {
  items?: ApiNewsItem[];
  news?: ApiNewsItem[];
  list?: ApiNewsItem[];
};

type NewsApiResponse = {
  success?: boolean;

  data?:
    | ApiNewsItem[]
    | ApiNewsListData;

  error?: {
    code?: string;
    message?: string;
  };
};

export type NewsItem = {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  publishedAt: string;
  href: string;
};

type NewsCenterProps = {
  locale: string;
  maxItems?: number;
  className?: string;
};

async function fetchNews(
  locale: Locale,
  maxItems = 3,
): Promise<NewsItem[]> {
  try {
    const pageSize = Math.min(
      Math.max(Math.trunc(maxItems), 1),
      12,
    );

    const origin = await getSiteOrigin();

    const query = new URLSearchParams({
      locale,
      page: "1",
      pageSize: String(pageSize),
    });

    const response = await fetch(
      `${origin}/api/news?${query.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },

        /*
         * 新闻发布或修改后首页立即更新。
         * 功能稳定后可改成 revalidate 缓存。
         */
        cache: "no-store",
      },
    );

    const result =
      (await response.json()) as NewsApiResponse;

    if (
      !response.ok ||
      result.success === false
    ) {
      throw new Error(
        result.error?.message ??
          `获取新闻失败：${response.status}`,
      );
    }

    const sourceItems =
      parseApiItems(result.data);

    return sourceItems
      .slice(0, pageSize)
      .map((item) =>
        normalizeNewsItem(
          item,
          locale,
        ),
      )
      .filter(
        (
          item,
        ): item is NewsItem =>
          item !== null,
      );
  } catch (error) {
    console.error(
      "[NewsCenter] 获取新闻失败：",
      error,
    );

    return [];
  }
}

export default async function NewsCenter({
  locale: localeValue,
  maxItems = 3,
  className = "",
}: NewsCenterProps) {
  const locale =
    normalizeLocale(localeValue);

  const t = await getTranslations({
    locale,
  });

  const newsList = await fetchNews(
    locale,
    maxItems,
  );

  const moreText = t(
    "newsCenter.moreText",
  );

  const noNewsText = t(
    "newsCenter.noNews",
  );

  const moreHref =
    `/${locale}/news`;

  return (
    <section
      className={[
        "bg-white px-5 py-14",
        "sm:px-8 sm:py-16",
        "lg:px-12 lg:py-20",
        className,
      ].join(" ")}
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="flex items-center justify-between gap-6">
          <h2 className="text-3xl font-bold tracking-wide text-[#2f67bd] sm:text-4xl">
            {t(
              "newsCenter.title",
            )}
          </h2>

          <Link
            href={moreHref}
            className="
              group hidden min-h-11 items-center justify-center gap-2
              rounded-full bg-[#2f67bd] px-7
              text-sm font-medium text-white
              transition duration-300
              hover:-translate-y-0.5 hover:bg-[#2459a8] hover:shadow-lg
              focus-visible:outline-none
              focus-visible:ring-4 focus-visible:ring-blue-200
              sm:inline-flex
            "
          >
            <span>{moreText}</span>

            <ArrowIcon />
          </Link>
        </div>

        <div className="mt-10 sm:mt-12">
          {newsList.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-xl bg-slate-50 px-6 text-center text-sm text-slate-500">
              {noNewsText}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {newsList.map(
                (item) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    locale={locale}
                  />
                ),
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href={moreHref}
            className="
              group inline-flex min-h-12 items-center justify-center gap-2
              rounded-full bg-[#2f67bd] px-8
              text-base font-medium text-white
              transition duration-300
              hover:bg-[#2459a8]
              focus-visible:outline-none
              focus-visible:ring-4 focus-visible:ring-blue-200
            "
          >
            <span>{moreText}</span>

            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}

function NewsCard({
  item,
  locale,
}: {
  item: NewsItem;
  locale: Locale;
}) {
  return (
    <Link
      href={item.href}
      aria-label={
        locale === "zh"
          ? `查看新闻：${item.title}`
          : `View news: ${item.title}`
      }
      className="
        block h-full rounded-lg
        focus-visible:outline-none
        focus-visible:ring-4
        focus-visible:ring-blue-200
      "
    >
      <article
        className="
          group flex h-full flex-col overflow-hidden rounded-lg bg-white
          shadow-[0_2px_10px_rgba(15,23,42,0.12)]
          transition duration-300
          hover:-translate-y-1
          hover:shadow-[0_8px_24px_rgba(15,23,42,0.16)]
        "
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.title}
              fill

              /*
               * 新闻图片来自本地媒体存储，
               * 不通过 Next.js 图片优化代理，避免刷新后图片失效。
               */
              unoptimized

              sizes="
                (min-width: 1280px) 31vw,
                (min-width: 768px) 48vw,
                100vw
              "
              className="
                object-cover
                transition
                duration-500
                group-hover:scale-105
              "
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-medium tracking-widest text-slate-400">
              HANLY NEWS
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-4 py-4 sm:px-5">
          <h3 className="line-clamp-2 text-base font-semibold leading-7 text-slate-800 sm:text-[17px]">
            {item.title}
          </h3>

          <time
            dateTime={
              item.publishedAt ||
              undefined
            }
            className="mt-auto block pt-2 text-sm text-slate-400"
          >
            {formatNewsDate(
              item.publishedAt,
              locale,
            )}
          </time>
        </div>
      </article>
    </Link>
  );
}

function parseApiItems(
  data:
    | ApiNewsItem[]
    | ApiNewsListData
    | undefined,
): ApiNewsItem[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data) {
    return [];
  }

  return (
    data.items ??
    data.news ??
    data.list ??
    []
  );
}

function normalizeNewsItem(
  item: ApiNewsItem,
  locale: Locale,
): NewsItem | null {
  const id =
    typeof item.id === "string"
      ? item.id.trim()
      : "";

  const title =
    typeof item.title === "string"
      ? item.title.trim()
      : "";

  const slug =
    typeof item.slug === "string"
      ? item.slug.trim()
      : "";

  if (!id || !title || !slug) {
    return null;
  }

  const publishedAt =
    item.publishedAt ??
    item.createdAt ??
    "";

  return {
    id,
    title,
    slug,
    image:
      resolveCoverImage(item),
    publishedAt,

    /*
     * 不再依赖接口返回 href，
     * 避免语言前缀重复或详情地址缺失。
     */
    href:
      `/${locale}/news/${encodeURIComponent(
        slug,
      )}`,
  };
}

function resolveCoverImage(
  item: ApiNewsItem,
): string | null {
  const compatibilityCover =
    typeof item.coverImage ===
    "string"
      ? item.coverImage
      : item.coverImage?.url;

  const value =
    item.coverImageAsset?.url ??
    item.coverImageUrl ??
    compatibilityCover ??
    null;

  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const trimmed =
    value.trim();

  return trimmed || null;
}

async function getSiteOrigin(): Promise<string> {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.APP_ORIGIN ??
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (configuredOrigin) {
    return configuredOrigin.replace(
      /\/+$/,
      "",
    );
  }

  const requestHeaders =
    await headers();

  const host =
    requestHeaders.get(
      "x-forwarded-host",
    ) ??
    requestHeaders.get("host");

  if (!host) {
    return "http://localhost:3000";
  }

  const forwardedProtocol =
    requestHeaders.get(
      "x-forwarded-proto",
    );

  const isLocal =
    host.startsWith(
      "localhost",
    ) ||
    host.startsWith(
      "127.0.0.1",
    );

  const protocol =
    forwardedProtocol ??
    (isLocal
      ? "http"
      : "https");

  return `${protocol}://${host}`;
}

function normalizeLocale(
  value: string,
): Locale {
  return value === "en"
    ? "en"
    : "zh";
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
    >
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatNewsDate(
  value: string,
  locale: Locale,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

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

  const localeCode =
    locale === "zh"
      ? "zh-CN"
      : "en-US";

  return new Intl.DateTimeFormat(
    localeCode,
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  )
    .format(date)
    .replaceAll("/", "-");
}