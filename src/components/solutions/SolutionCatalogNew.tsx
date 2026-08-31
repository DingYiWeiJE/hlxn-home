"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { solutionEmitter } from "@/lib/solutions-events";

type Locale = "zh" | "en";

interface SolutionCategory {
  id: string;
  chName: string;
  enName: string;
}

interface SolutionItem {
  id: string;
  title: string;
  image: string | null;
  slug: string;
  href: string;
}

interface ApiSolution {
  id: string;
  title: string;
  slug: string;
  locale?: Locale;
  coverImage?: {
    url?: string | null;
  } | null;
}

interface ApiResponse {
  success?: boolean;
  data?: {
    items?: ApiSolution[];
    solutions?: ApiSolution[];
    list?: ApiSolution[];
    categories?: SolutionCategory[];
  };
  error?: {
    code?: string;
    message?: string;
  };
}

const PAGE_SIZE = 12;

const text = {
  zh: {
    fetchError: "解决方案列表获取失败",
    empty: "暂无解决方案内容",
    viewDetail: "查看详情",
    allCategories: "全部分类",
  },
  en: {
    fetchError: "Failed to load solutions",
    empty: "No solutions available",
    viewDetail: "View details",
    allCategories: "All Categories",
  },
} satisfies Record<Locale, Record<string, string>>;

export default function SolutionCatalog({ locale }: { locale: Locale }) {
  const searchParams = useSearchParams();
  const sectionRef = useRef<HTMLElement>(null);

  const labels = text[locale];

  const [categories, setCategories] = useState<SolutionCategory[]>([]);
  const [solutions, setSolutions] = useState<SolutionItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // 从 URL 获取初始选中的分类
  useEffect(() => {
    const categoryId = searchParams.get("category");
    setSelectedCategory(categoryId);
  }, [searchParams]);

  // 加载分类列表
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/admin/solution-categories", {
          credentials: "include",
        });
        const result = (await response.json()) as ApiResponse;
        if (result.success && result.data?.categories) {
          setCategories(result.data.categories);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }

    fetchCategories();
  }, []);

  // 加载解决方案列表
  useEffect(() => {
    const controller = new AbortController();

    async function fetchSolutions() {
      setIsLoading(true);
      setError("");

      try {
        const query = new URLSearchParams({
          locale,
          pageSize: String(PAGE_SIZE),
        });

        if (selectedCategory) {
          query.set("type", selectedCategory);
        }

        const response = await fetch(`/api/solutions?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const result = (await response.json()) as ApiResponse;

        if (!response.ok || result.success === false) {
          throw new Error(result.error?.message ?? labels.fetchError);
        }

        const items = result.data?.items ?? result.data?.solutions ?? [];
        setSolutions(
          items.map((item: ApiSolution) => ({
            id: item.id,
            title: item.title,
            image: item.coverImage?.url ?? null,
            slug: item.slug,
            href: `/${locale}/solutions/${item.slug}`,
          }))
        );
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name === "AbortError") {
          return;
        }

        console.error("Failed to load solutions:", requestError);
        setSolutions([]);
        setError(
          requestError instanceof Error ? requestError.message : labels.fetchError
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchSolutions();

    return () => {
      controller.abort();
    };
  }, [locale, selectedCategory, labels.fetchError]);

  // 监听导航菜单事件
  useEffect(() => {
    const handleChangeSolutionCategory = (categoryId: string | null) => {
      setSelectedCategory(categoryId);

      window.requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    };

    solutionEmitter.on("changeSolutionCategory", handleChangeSolutionCategory);

    return () => {
      solutionEmitter.off("changeSolutionCategory", handleChangeSolutionCategory);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full scroll-mt-24 bg-white py-10 sm:py-12 lg:py-16"
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-6 lg:px-8">
        {/* 分类 Tab */}
        <div className="mb-8 flex border-b border-slate-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory(null);
              window.requestAnimationFrame(() => {
                sectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              });
            }}
            className={[
              "px-6 py-3 font-medium text-base transition-colors border-b-2 -mb-px whitespace-nowrap",
              selectedCategory === null
                ? "text-[#2463c5] border-[#2463c5]"
                : "text-slate-600 border-transparent hover:text-slate-900",
            ].join(" ")}
            aria-current={selectedCategory === null ? "page" : undefined}
          >
            {labels.allCategories}
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setSelectedCategory(category.id);
                window.requestAnimationFrame(() => {
                  sectionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                });
              }}
              className={[
                "px-6 py-3 font-medium text-base transition-colors border-b-2 -mb-px whitespace-nowrap",
                selectedCategory === category.id
                  ? "text-[#2463c5] border-[#2463c5]"
                  : "text-slate-600 border-transparent hover:text-slate-900",
              ].join(" ")}
              aria-current={selectedCategory === category.id ? "page" : undefined}
            >
              {locale === "zh" ? category.chName : category.enName}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="aspect-[16/10] animate-pulse bg-slate-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 text-center text-red-700">
            {error}
          </div>
        ) : solutions.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {solutions.map((item) => (
              <article
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
              >
                <Link
                  href={item.href}
                  aria-label={item.title}
                  className="relative block aspect-[16/10] overflow-hidden bg-slate-100"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      unoptimized={item.image.startsWith("/media/") || item.image.startsWith("/uploads/")}
                      sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, (max-width: 1535px) 33vw, 25vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
                      SOLUTION
                    </div>
                  )}

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </Link>

                <div className="flex flex-1 flex-col px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                  <h3
                    className="line-clamp-2 text-[17px] font-bold leading-[1.65] text-slate-900 transition-colors group-hover:text-[#2463c5] sm:text-base"
                  >
                    <Link href={item.href}>{item.title}</Link>
                  </h3>

                  <Link
                    href={item.href}
                    aria-label={`${labels.viewDetail}：${item.title}`}
                    className="mt-auto flex shrink-0 items-center gap-1 pt-4 text-sm font-medium text-[#2463c5] transition-transform hover:translate-x-1"
                  >
                    {labels.viewDetail}

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
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-slate-500">
            {labels.empty}
          </div>
        )}
      </div>
    </section>
  );
}
