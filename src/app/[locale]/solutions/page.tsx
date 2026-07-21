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
        ? "解决方案 | 汉理楚能"
        : "Solutions | Hanli Chuneng",
    description:
      locale === "zh"
        ? "查看汉理楚能的行业解决方案"
        : "View Hanli Chuneng's industry solutions",
  };
}

function SolutionsContent() {
  const t = useTranslations();
  const page = t.raw("solutionsPage");

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

          <div className="space-y-8">
            {page.solutions.map(
              (solution: { name: string; description: string }, index: number) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-blue-50 to-green-50 border border-gray-200 rounded-lg p-8"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="ml-6 flex-grow">
                      <h3 className="text-2xl font-bold mb-2 text-gray-900">
                        {solution.name}
                      </h3>
                      <p className="text-gray-600 text-lg">
                        {solution.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default async function Solutions({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SolutionsContent />;
}
