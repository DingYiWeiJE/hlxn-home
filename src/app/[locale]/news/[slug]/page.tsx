import type { Metadata } from "next";
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

  return (
    <div className="flex min-h-screen flex-col bg-[white]">
      <div className="border-b border-slate-100 bg-white">
        <Navigation hasbg/>
      </div>
      <header className="border-b border-slate-200 bg-[#3060AC] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1200px]">
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
      <main className="w-full mx-auto max-w-[1200px] px-4 py-30 pt-[80px] bg-white min-h-screen">
        
        <article className="space-y-6">
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
