import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TiptapContent from "@/components/news/TiptapContent";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const news = await prisma.news.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null, publishedAt: { lte: new Date() } },
  });
  if (!news) return {};
  return {
    title: news.title,
    description: news.summary ?? undefined,
    openGraph: {
      title: news.title,
      description: news.summary ?? undefined,
      images: news.coverImage ? [news.coverImage] : undefined,
    },
    alternates: { canonical: `/news/${news.slug}` },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const news = await prisma.news.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null, publishedAt: { lte: new Date() } },
  });
  if (!news) notFound();

  const previous = await prisma.news.findFirst({
    where: { status: "PUBLISHED", deletedAt: null, publishedAt: { lt: news.publishedAt ?? news.createdAt } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: { title: true, slug: true },
  });
  const next = await prisma.news.findFirst({
    where: { status: "PUBLISHED", deletedAt: null, publishedAt: { gt: news.publishedAt ?? news.createdAt } },
    orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
    select: { title: true, slug: true },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <article className="space-y-6">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold">{news.title}</h1>
          <div className="text-sm text-slate-500">
            <span>{news.authorName ?? "Hanli Chuneng"}</span>
            <span className="mx-2">·</span>
            <time>{news.publishedAt?.toLocaleString()}</time>
          </div>
          {news.coverImage && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-slate-100">
              <Image src={news.coverImage} alt={news.coverImageAlt ?? news.title} fill className="object-cover" />
            </div>
          )}
        </header>
        <TiptapContent content={news.content as never} />
        <nav className="flex justify-between border-t border-slate-200 pt-6 text-sm">
          <div>{previous && <Link href={`/news/${previous.slug}`}>上一篇：{previous.title}</Link>}</div>
          <div>{next && <Link href={`/news/${next.slug}`}>下一篇：{next.title}</Link>}</div>
        </nav>
      </article>
    </main>
  );
}
