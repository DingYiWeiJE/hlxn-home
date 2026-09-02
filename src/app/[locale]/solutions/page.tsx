import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
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
      <section className="relative flex h-[60vh] min-h-[420px] flex-col overflow-hidden">
        <Image
          src="/images/solutions/solutions-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#001524]/60" />
        <div className="relative z-10 flex h-full flex-col">
          <Navigation />
          <div className="flex flex-1 items-center">
            <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8">
              <h1 className="max-w-3xl text-[3rem] font-bold text-white ">
                {t("solutionsPageContent.heroTitle")}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white md:text-xl">
                {t("solutionsPageContent.heroSubtitle")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <Suspense fallback={<div className="min-h-96" />}>
          <SolutionCatalogNew locale={normalizedLocale} />
        </Suspense>
      </main>

      <Footer locale={normalizedLocale} />
    </div>
  );
}
