import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export type NewsItem = {
  id: string | number;
  title: string;
  image: string;
  publishedAt: string;
  href?: string;
};

type NewsApiResponse = {
  success: boolean;
  data: {
    items: NewsItem[];
    pagination: {
      total: number;
    };
  };
};

type NewsCenterProps = {
  locale: string;
  maxItems?: number;
  className?: string;
};

async function fetchNews(maxItems: number = 3): Promise<NewsItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    console.log(`[NewsCenter] Fetching news from: ${baseUrl}/api/news?pageSize=${maxItems}`);
    const response = await fetch(`${baseUrl}/api/news?pageSize=${maxItems}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`获取新闻失败：${response.status}`);
    }

    const data = (await response.json()) as NewsApiResponse;
    const items = Array.isArray(data.data.items) ? data.data.items.slice(0, maxItems) : [];
    console.log(`[NewsCenter] Successfully fetched ${items.length} news items`);
    return items;
  } catch (err) {
    console.error("[NewsCenter] Failed to fetch news:", err);
    return [];
  }
}

export default async function NewsCenter({
  locale,
  maxItems = 3,
  className = "",
}: NewsCenterProps) {
  const t = await getTranslations({ locale });
  const newsList = await fetchNews(maxItems);

  const moreText = t("newsCenter.moreText");
  const moreHref = `/${locale}/news`;
  const noNewsText = t("newsCenter.noNews");

  // 添加 locale 前缀到每个新闻项的 href
  const newsListWithLocale = newsList.map((item) => ({
    ...item,
    href: item.href ? `/${locale}${item.href}` : undefined,
  }));

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
            {t("newsCenter.title")}
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
          {newsList.length === 0 && (
            <div className="flex min-h-48 items-center justify-center rounded-xl bg-slate-50 px-6 text-center text-sm text-slate-500">
              {noNewsText}
            </div>
          )}

          {newsList.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {newsListWithLocale.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
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

function NewsCard({ item }: { item: NewsItem }) {
  const content = (
    <article
      className="
        group h-full overflow-hidden rounded-lg bg-white
        shadow-[0_2px_10px_rgba(15,23,42,0.12)]
        transition duration-300
        hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(15,23,42,0.16)]
      "
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="
            (min-width: 1280px) 31vw,
            (min-width: 768px) 48vw,
            100vw
          "
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="px-4 py-4 sm:px-5">
        <h3 className="line-clamp-2 text-base font-semibold leading-7 text-slate-800 sm:text-[17px]">
          {item.title}
        </h3>

        <time
          dateTime={item.publishedAt}
          className="mt-2 block text-sm text-slate-400"
        >
          {formatNewsDate(item.publishedAt)}
        </time>
      </div>
    </article>
  );

  if (!item.href) {
    return content;
  }

  return (
    <Link
      href={item.href}
      className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
    >
      {content}
    </Link>
  );
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

function formatNewsDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("/", "-");
}