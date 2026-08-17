import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
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
          url: true,
        },
      },
    },
  });

  if (!news) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: news.title,
    description: news.summary || "新闻详情",
    openGraph: {
      title: news.title,
      description: news.summary || "新闻详情",
      images: news.coverImageAsset?.url
        ? [{ url: news.coverImageAsset.url }]
        : [],
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
          url: true,
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

  return (
    <div className="flex min-h-screen flex-col bg-[#e7f6ff]">
      <div className="border-b border-slate-100 bg-white">
        <Navigation hasbg/>
      </div>
      <NewsTracker newsId={news.id} />
    <main className="w-full mx-auto max-w-4xl px-4 py-30 pt-[80px] bg-white min-h-screen">

      {news.coverImageAsset?.url && (
        <div className="mb-8 overflow-hidden rounded-lg">
          <div className="relative aspect-video bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${news.coverImageAsset.url}?t=${news.coverImageAsset.id || news.id}`}
              alt={news.coverImageAlt || news.title}
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      <article className="space-y-6">
        <header className="border-b border-slate-200 pb-6">
          <h1 className="mb-4 text-4xl font-bold">{news.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            {news.publishedAt && (
              <time dateTime={news.publishedAt.toISOString()}>
                {news.publishedAt.toLocaleString()}
              </time>
            )}
          </div>
          {news.summary && (
            <p className="mt-4 text-lg text-slate-700">{news.summary}</p>
          )}
        </header>

        {news.content && (
          <div className="prose prose-sm max-w-none">
            <TiptapContent content={news.content as TiptapNode} />
          </div>
        )}
      </article>
    </main>
      <Footer locale={locale} />
    </div>
  );
}
