import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import TiptapContent from "@/components/news/TiptapContent";
import Link from "next/link";

type Props = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const news = await prisma.news.findUnique({
    where: { slug },
    select: {
      title: true,
      summary: true,
      coverImage: true,
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
      images: news.coverImage ? [{ url: news.coverImage }] : [],
    },
  };
}

export default async function NewsDetail({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const news = await prisma.news.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      summary: true,
      content: true,
      coverImage: true,
      publishedAt: true,
      createdAt: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!news || news.status !== "PUBLISHED" || news.deletedAt !== null || (news.publishedAt && news.publishedAt > new Date())) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link href={`/${locale}/news`} className="mb-6 inline-flex items-center text-blue-600 hover:text-blue-800">
        ← {t("news.back", "返回新闻列表")}
      </Link>

      {news.coverImage && (
        <div className="mb-8 overflow-hidden rounded-lg">
          <div className="relative aspect-video bg-slate-100">
            <Image src={news.coverImage} alt={news.title} fill className="object-cover" />
          </div>
        </div>
      )}

      <article className="space-y-6">
        <header className="border-b border-slate-200 pb-6">
          <h1 className="mb-4 text-4xl font-bold">{news.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            {news.publishedAt && <time dateTime={news.publishedAt.toISOString()}>{news.publishedAt.toLocaleString()}</time>}
          </div>
          {news.summary && <p className="mt-4 text-lg text-slate-700">{news.summary}</p>}
        </header>

        {news.content && (
          <div className="prose prose-sm max-w-none">
            <TiptapContent content={news.content} />
          </div>
        )}
      </article>

      <nav className="mt-12 border-t border-slate-200 pt-8">
        <Link href={`/${locale}/news`} className="inline-flex items-center text-blue-600 hover:text-blue-800">
          ← {t("news.back", "返回新闻列表")}
        </Link>
      </nav>
    </main>
  );
}
