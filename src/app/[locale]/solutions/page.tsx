import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import Footer from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SolutionCatalogNew from "@/components/solutions/SolutionCatalogNew";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const normalizedLocale = locale === "en" ? "en" : "zh";
  const t = await getTranslations({ locale: normalizedLocale });

  return {
    title: `${t("solutionsPageContent.heroTitle")} | ${
      normalizedLocale === "zh" ? "汉理新能" : "Hanli Chuneng"
    }`,
    description: t("solutionsPageContent.heroSubtitle"),
    alternates: {
      canonical: `/${normalizedLocale}/solutions`,
    },
  };
}

export default async function SolutionsPage({ params }: Props) {
  const { locale } = await params;
  const normalizedLocale = locale === "en" ? "en" : "zh";
  setRequestLocale(normalizedLocale);

  const t = await getTranslations({ locale: normalizedLocale });

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PageHero
        location="SOLUTIONS"
        fallbackImage="/images/solutions/solutions-bg.jpg"
        title={t("solutionsPageContent.heroTitle")}
        subtitle={t("solutionsPageContent.heroSubtitle")}
        heightClassName="h-[60vh] min-h-[420px]"
        titleClassName="max-w-3xl text-[3rem] font-bold text-white"
        subtitleClassName="mt-4 max-w-2xl text-lg leading-8 text-white md:text-xl"
      />

      <main className="flex-1">
        <Suspense fallback={<div className="min-h-96" />}>
          <SolutionCatalogNew locale={normalizedLocale} />
        </Suspense>
      </main>

      <Footer locale={normalizedLocale} />
    </div>
  );
}
