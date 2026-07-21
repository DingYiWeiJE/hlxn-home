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
        ? "关于我们 | 汉理楚能"
        : "About Us | Hanli Chuneng",
    description:
      locale === "zh"
        ? "了解汉理楚能的公司信息和发展历程"
        : "Learn about Hanli Chuneng's company information and development",
  };
}

function AboutContent() {
  const t = useTranslations();
  const page = t.raw("aboutPage");

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4 text-gray-900">
              {page.title}
            </h1>
            <p className="text-xl text-gray-600 mb-4">{page.subtitle}</p>
            <p className="text-lg text-gray-700">{page.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="bg-blue-50 p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                {page.section1.title}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {page.section1.content}
              </p>
            </div>

            <div className="bg-green-50 p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                {page.section2.title}
              </h2>
              <ul className="space-y-3">
                {page.section2.items.map((item: string, index: number) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default async function About({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AboutContent />;
}
