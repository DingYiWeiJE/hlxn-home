// components/home/NewsCenter.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type NewsItem = {
  id: string | number;
  title: string;
  image: string;
  publishedAt: string;
  href?: string;
};

type NewsApiResponse = {
  list: NewsItem[];
};

export type NewsCenterProps = {
  apiUrl: string;
  title?: string;
  moreText?: string;
  moreHref?: string;
  maxItems?: number;
  className?: string;
};

export default function NewsCenter({
  apiUrl,
  title = "新闻中心",
  moreText = "了解更多",
  moreHref = "/news",
  maxItems = 3,
  className = "",
}: NewsCenterProps) {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchNews() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`获取新闻失败：${response.status}`);
        }

        const data = (await response.json()) as NewsApiResponse;

        setNewsList(
          Array.isArray(data.list) ? data.list.slice(0, maxItems) : [],
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError(err instanceof Error ? err.message : "新闻加载失败");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchNews();

    return () => {
      controller.abort();
    };
  }, [apiUrl, maxItems]);

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
            {title}
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
          {loading && <NewsSkeleton count={maxItems} />}

          {!loading && error && (
            <div className="flex min-h-48 items-center justify-center rounded-xl bg-slate-50 px-6 text-center text-sm text-slate-500">
              {error}
            </div>
          )}

          {!loading && !error && newsList.length === 0 && (
            <div className="flex min-h-48 items-center justify-center rounded-xl bg-slate-50 px-6 text-center text-sm text-slate-500">
              暂无新闻内容
            </div>
          )}

          {!loading && !error && newsList.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {newsList.map((item) => (
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

function NewsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg bg-white shadow-[0_2px_10px_rgba(15,23,42,0.1)]"
        >
          <div className="aspect-[16/9] animate-pulse bg-slate-200" />

          <div className="space-y-3 px-4 py-4 sm:px-5">
            <div className="h-5 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
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