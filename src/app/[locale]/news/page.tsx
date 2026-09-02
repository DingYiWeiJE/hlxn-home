import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import Footer from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
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

  return (
    <div className="flex min-h-screen flex-col">
      <PageHero
        location="NEWS"
        fallbackImage="/images/news/news-bg.jpg"
        title={t("newsPage.title")}
        subtitle={t("newsPage.subtitle")}
        overlayClassName="bg-[#070614] opacity-50"
      />
      <NewsList />
      <Footer locale={locale} />
    </div>
  );
}
