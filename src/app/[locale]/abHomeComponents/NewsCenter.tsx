import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

type Locale = "zh" | "en";

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

async function fetchNews(locale: Locale, maxItems = 3): Promise<NewsItem[]> {
  try {
    const pageSize = Math.min(Math.max(Math.trunc(maxItems), 1), 12);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const apiUrl = `${baseUrl}/api/news?locale=${locale}&page=1&pageSize=${pageSize}`;

    console.log(`[NewsCenter] 开始获取新闻，URL=${apiUrl}`);

    const response = await fetch(apiUrl, {
      cache: "no-store",
      next: { revalidate: 0 }
    });

    console.log(`[NewsCenter] 新闻 API 响应状态=${response.status}`);

    if (!response.ok) {
      console.error(`[NewsCenter] 新闻 API 失败，状态=${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data.data?.items || !Array.isArray(data.data.items)) {
      return [];
    }

    return data.data.items
      .slice(0, pageSize)
      .map((item: any) => normalizeNewsItem(item, locale))
      .filter((item: any): item is NewsItem => item !== null);
  } catch (error) {
    console.error("[NewsCenter] 获取新闻异常：", error);
    return [];
  }
}

export default async function NewsCenter({
  locale: localeValue,
  maxItems = 3,
  className = "",
}: NewsCenterProps) {
  const locale = normalizeLocale(localeValue);
  const t = await getTranslations({ locale });
  const newsList = await fetchNews(locale, maxItems);
  const moreText = t("newsCenter.moreText");
  const noNewsText = t("newsCenter.noNews");
  const moreHref = `/${locale}/news`;

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
          <h2 className="text-[3rem] font-bold tracking-wide text-[#2f67bd]">
            {t("newsCenter.title")}
          </h2>

          <Link
            href={moreHref}
            className="group hidden min-h-11 items-center justify-center gap-2 rounded-full bg-[#2f67bd] px-7 text-sm font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#2459a8] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:inline-flex"
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
              {newsList.map((item) => (
                <NewsCard key={item.id} item={item} locale={locale} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href={moreHref}
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2f67bd] px-8 text-base font-medium text-white transition duration-300 hover:bg-[#2459a8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
          >
            <span>{moreText}</span>
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}

function NewsCard({ item, locale }: { item: NewsItem; locale: Locale }) {
  return (
    <Link
      href={item.href}
      aria-label={locale === "zh" ? `查看新闻：${item.title}` : `View news: ${item.title}`}
      className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
    >
      <article className="group flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-[0_2px_10px_rgba(15,23,42,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(15,23,42,0.16)]">
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.title}
              fill
              unoptimized
              sizes="(min-width: 1280px) 31vw, (min-width: 768px) 48vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-105"
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
          <time dateTime={item.publishedAt || undefined} className="mt-auto block pt-2 text-sm text-slate-400">
            {formatNewsDate(item.publishedAt, locale)}
          </time>
        </div>
      </article>
    </Link>
  );
}

function normalizeNewsItem(
  item: any,
  locale: Locale,
): NewsItem | null {
  const id = typeof item.id === "string" ? item.id.trim() : "";
  const title = typeof item.title === "string" ? item.title.trim() : "";
  const slug = typeof item.slug === "string" ? item.slug.trim() : "";

  if (!id || !title || !slug) {
    return null;
  }

  const publishedAt = item.publishedAt ?? item.createdAt ?? "";

  return {
    id,
    title,
    slug,
    image: resolveCoverImage(item),
    publishedAt: publishedAt instanceof Date ? publishedAt.toISOString() : publishedAt,
    href: `/${locale}/news/${encodeURIComponent(slug)}`,
  };
}

function resolveCoverImage(item: any): string | null {
  const value = item.coverImage?.url ?? item.coverImageAsset?.url ?? null;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeLocale(value: string): Locale {
  return value === "en" ? "en" : "zh";
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

function formatNewsDate(value: string, locale: Locale) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  const localeCode = locale === "zh" ? "zh-CN" : "en-US";

  return new Intl.DateTimeFormat(localeCode, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("/", "-");
}
