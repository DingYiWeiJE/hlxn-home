import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { buildMediaUrl } from "@/lib/media/asset-url";
import TiptapContent from "@/components/news/TiptapContent";
import type { TiptapNode } from "@/lib/news/tiptap";
import Footer from "@/components/SiteFooter";
import Navigation from "@/components/Navigation";
import { NewsTracker } from "@/components/analytics/Tracker";

type Props = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  const news = await prisma.news.findFirst({
    where: {
      slug,
      locale: locale === "zh" ? "zh" : "en",
    },
    select: {
      title: true,
      summary: true,
      coverImageAsset: {
        select: {
          id: true,
          relativePath: true,
        },
      },
    },
  });

  if (!news) {
    return {
      title: "Not Found",
    };
  }

  const coverUrl = news.coverImageAsset
    ? buildMediaUrl(news.coverImageAsset.relativePath)
    : null;

  return {
    title: news.title,
    description: news.summary || "新闻详情",
    openGraph: {
      title: news.title,
      description: news.summary || "新闻详情",
      images: coverUrl ? [{ url: coverUrl }] : [],
    },
  };
}

export default async function NewsDetail({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const news = await prisma.news.findFirst({
    where: {
      slug,
      locale: locale === "zh" ? "zh" : "en",
    },
    select: {
      id: true,
      title: true,
      summary: true,
      content: true,

      coverImageAlt: true,

      coverImageAsset: {
        select: {
          id: true,
          relativePath: true,
        },
      },

      publishedAt: true,
      createdAt: true,
      status: true,
      deletedAt: true,
    },
  });

  if (
    !news ||
    news.status !== "PUBLISHED" ||
    news.deletedAt !== null ||
    (news.publishedAt && news.publishedAt > new Date())
  ) {
    notFound();
  }

  // 上一篇 / 下一篇（同语言、已发布、非未来），按发布时间排序
  const referenceDate = news.publishedAt ?? news.createdAt;
  const siblingWhere = {
    locale: (locale === "zh" ? "zh" : "en") as "zh" | "en",
    status: "PUBLISHED" as const,
    deletedAt: null,
    id: { not: news.id },
  };

  const [previous, next] = await Promise.all([
    // 上一篇：更早发布的一篇
    prisma.news.findFirst({
      where: {
        ...siblingWhere,
        publishedAt: { lt: referenceDate },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: { title: true, slug: true },
    }),
    // 下一篇：更晚发布但不晚于当前时间的一篇
    prisma.news.findFirst({
      where: {
        ...siblingWhere,
        publishedAt: { gt: referenceDate, lte: new Date() },
      },
      orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
      select: { title: true, slug: true },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[white]">
      <div className="border-b border-slate-100 bg-white">
        <Navigation hasbg/>
      </div>
      <header className="border-b border-slate-200 bg-[#3060AC] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1200px]">
          <Link
            href={`/${locale}/news`}
            aria-label={t("news.back")}
            className="mb-4 inline-flex text-white/90 transition-colors hover:text-white"
          >
            <svg
              className="icon"
              viewBox="0 0 1103 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              aria-hidden="true"
            >
              <path
                d="M11.652047 412.151798a41.805655 41.805655 0 0 0 0 57.945315l415.69465 407.034345c15.9822 15.746009 41.097085 2.834282 41.097085-21.178382V596.85249s605.591525-222.176194 552.527473 409.711166c-1.417141 17.871721 19.839972 23.697744 25.429805 7.085705 79.832268-242.488546 189.188304-815.643291-586.460123-764.941141l6.534594-219.656832c0.7873-24.406315-24.721235-38.184073-41.097085-22.123144L11.652047 412.151798z"
                fill="currentColor"
              ></path>
            </svg>
          </Link>
          <h1 className="mb-4 text-[3rem] font-bold text-white">{news.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-200">
            {news.publishedAt && (
              <time dateTime={news.publishedAt.toISOString()}>
                {news.publishedAt.toLocaleString()}
              </time>
            )}
          </div>
        </div>
      </header>
      <NewsTracker newsId={news.id} />
      <main className="w-full mx-auto max-w-[1200px] px-4 py-30 pt-[80px] bg-white" style={{minHeight: "calc(100vh - 55rem)"}}>
        
        <article className="space-y-6">
          {news.content && (
            <div className="prose prose-sm max-w-none">
              <TiptapContent content={news.content as TiptapNode} />
            </div>
          )}
        </article>
      </main>

      {(previous || next) && (
        <div className="w-full bg-white">
          <nav
            aria-label={t("news.title")}
            className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 border-t border-slate-200 px-4 py-10 sm:grid-cols-2"
          >
            {previous ? (
              <Link
                href={`/${locale}/news/${previous.slug}`}
                className="group flex flex-col rounded-xl border border-slate-200 p-5 transition hover:border-[#2463c5] hover:shadow-md"
              >
                <span className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-500">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                    className="h-4 w-4"
                  >
                    <path
                      d="M12 4 6 10l6 6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {t("news.previous")}
                </span>
                <span className="line-clamp-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-[#2463c5]">
                  {previous.title}
                </span>
              </Link>
            ) : (
              <span aria-hidden="true" className="hidden sm:block" />
            )}

            {next ? (
              <Link
                href={`/${locale}/news/${next.slug}`}
                className="group flex flex-col rounded-xl border border-slate-200 p-5 text-right transition hover:border-[#2463c5] hover:shadow-md sm:items-end"
              >
                <span className="mb-2 flex items-center justify-end gap-1 text-sm font-medium text-slate-500">
                  {t("news.next")}
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                    className="h-4 w-4"
                  >
                    <path
                      d="M8 4l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="line-clamp-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-[#2463c5]">
                  {next.title}
                </span>
              </Link>
            ) : (
              <span aria-hidden="true" className="hidden sm:block" />
            )}
          </nav>
        </div>
      )}

      <Footer locale={locale} />
    </div>
  );
}
