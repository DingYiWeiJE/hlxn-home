import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export const metadata: Metadata = {
  title: "新闻",
  description: "公司新闻与动态",
};
export const dynamic = "force-dynamic";

export default async function LocaleNews({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const items = await prisma.news.findMany({
    where: {
      locale: locale === "zh" ? "zh" : "en",
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { lte: new Date() }
    },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      coverImage: true,
      publishedAt: true,
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-semibold">{t("news.title")}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <Link key={item.id} href={`/${locale}/news/${item.slug}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="relative aspect-[16/9] bg-slate-100">
              <Image src={item.coverImage ?? "/images/home/home-bg-1.jpg"} alt={item.title} fill className="object-cover" />
            </div>
            <div className="space-y-3 p-4">
              <h2 className="text-xl font-medium">{item.title}</h2>
              {item.summary && <p className="text-sm text-slate-600">{item.summary}</p>}
              <time className="block text-xs text-slate-500">{item.publishedAt?.toLocaleString()}</time>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
