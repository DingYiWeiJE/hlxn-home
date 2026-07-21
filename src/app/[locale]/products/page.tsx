import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
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
        ? "产品中心 | 汉理楚能"
        : "Products | Hanli Chuneng",
    description:
      locale === "zh"
        ? "了解汉理楚能的产品解决方案"
        : "Explore Hanli Chuneng's product solutions",
  };
}

function ProductsContent({ locale }: { locale: string }) {
  const t = useTranslations();
  const page = t.raw("productsPage");

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
            {page.products.map(
              (product: { name: string; description: string }, index: number) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-lg mb-4"></div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    {product.name}
                  </h3>
                  <p className="text-gray-600">{product.description}</p>
                </div>
              )
            )}
          </div>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default async function Products({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProductsContent locale={locale} />;
}
