import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
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

  return (
    <div className="flex min-h-screen flex-col">
      <div
        className="relative flex h-[60vh] flex-col bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/news/news-bg.jpg')",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-[#070614] opacity-50" />
        <div className="relative flex h-full flex-col">
          <Navigation />
          <div className="flex flex-1 flex-col items-start justify-center">
            <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8">
              <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
                新闻中心
              </h1>
            </div>
          </div>
        </div>
      </div>
      <NewsList />
      <Footer locale={locale} />
    </div>
  );
}
