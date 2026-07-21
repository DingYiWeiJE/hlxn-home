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
        ? "应用案例 | 汉理楚能"
        : "Cases | Hanli Chuneng",
    description:
      locale === "zh"
        ? "查看汉理楚能的客户成功案例"
        : "View Hanli Chuneng's customer success stories",
  };
}

function CasesContent() {
  const t = useTranslations();
  const page = t.raw("casesPage");

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {page.cases.map(
              (caseItem: { title: string; company: string; result: string }, index: number) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-8 border-2 border-green-200 hover:border-green-500 transition-colors"
                >
                  <div className="mb-4">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      ✓
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {caseItem.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {caseItem.company}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <p className="text-green-700 font-semibold">
                      {caseItem.result}
                    </p>
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

export default async function Cases({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CasesContent />;
}
