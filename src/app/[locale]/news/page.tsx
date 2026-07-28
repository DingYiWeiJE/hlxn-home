import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import NewsList from "./components/NewsList";

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
      coverImageAssetId: true,
      coverImageAlt: true,
      coverImageAsset: {
        select: {
          id: true,
          url: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          width: true,
          height: true,
          alt: true,
        },
      },
      publishedAt: true,
    },
  });

    return (
      <div className="flex min-h-screen flex-col">
        <div
          className="relative h-[60vh] bg-cover bg-center flex flex-col"
          style={{
            backgroundImage: "url('/images/news/news-bg.jpg')",
            backgroundAttachment: "fixed",
          }}
        >
          <div className="absolute inset-0 bg-[#070614] opacity-50"></div>
          <div className="relative flex flex-col h-full">
            <Navigation />
            <div className="flex-1 flex flex-col items-start justify-center">
              <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                  新闻中心
                </h1>
              </div>
            </div>
          </div>
        </div>
        <NewsList/>
        <Footer locale={locale} />
      </div>
    );
}
