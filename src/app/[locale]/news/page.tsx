import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title:
      locale === "zh"
        ? "新闻中心 | 汉理楚能"
        : "News | Hanli Chuneng",
    description:
      locale === "zh"
        ? "了解汉理楚能的最新动态和新闻"
        : "Stay updated with Hanli Chuneng's latest news",
  };
}

function NewsContent() {
  const t = useTranslations();
  const page = t.raw("newsPage");

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4 text-gray-900">
              {page.title}
            </h1>
            <p className="text-xl text-gray-600">{page.subtitle}</p>
          </div>

          <div className="space-y-8 max-w-3xl mx-auto">
            {page.news.map(
              (newsItem: { date: string; title: string; summary: string }, index: number) => (
                <article
                  key={index}
                  className="bg-white border-l-4 border-blue-600 p-8 rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <time className="text-sm text-gray-500 font-semibold">
                      {newsItem.date}
                    </time>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                      {index === 0 ? "Latest" : index === 1 ? "Featured" : "Archive"}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">
                    {newsItem.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed mb-4">
                    {newsItem.summary}
                  </p>
                  <a
                    href="#"
                    className="inline-block text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                  >
                    Read More →
                  </a>
                </article>
              )
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default async function News({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NewsContent />;
}
