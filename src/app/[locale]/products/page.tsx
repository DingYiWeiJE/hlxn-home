import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
import type { Metadata } from "next";
import ProductCatalog from "../../../components/admin/products/ProductCatalog";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "zh" ? "产品中心 | 汉理楚能" : "Products | Hanli Chuneng",
    description:
      locale === "zh"
        ? "了解汉理楚能的产品解决方案"
        : "Explore Hanli Chuneng's product solutions",
  };
}

async function ProductsContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });
  const page = t.raw("productsPageContent");

  return (
    <div className="flex min-h-screen flex-col">
      <div
        className="relative h-[60vh] bg-cover bg-center flex flex-col"
        style={{
          backgroundImage: "url('/images/products/product_bg.jpg')",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-[#001524C9] opacity-50"></div>
        <div className="relative flex flex-col h-full">
          <Navigation />
          <div className="flex-1 flex flex-col items-start justify-center">
            <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                {page.heroTitle}
              </h1>
              <p className="text-lg md:text-xl text-white max-w-2xl">
                {page.heroSubtitle}
              </p>
            </div>
          </div>
        </div>
      </div>
      <main>
        <section className="bg-[#eaf7ff] py-20 lg:py-28">
          <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8">
            <h1 className="mb-6 md:mb-8 text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide text-[#2365c4]">
              {page.introTitle}
            </h1>

            <div className="space-y-4 md:space-y-6 text-sm md:text-base leading-[1.8] text-[#1f3448] lg:max-w-[500px]">
              {[page.introText1, page.introText2].map((intro, index) => (
                <p key={index}>{intro}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full bg-white">
          <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-8 lg:py-20">
            <h2 className="text-center text-[32px] font-bold tracking-[2px] text-[#2463c5] md:text-[40px]">
              {page.productsSeriesTitle}
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-x-20 gap-y-12 md:grid-cols-2 md:gap-y-14">
              {page.productSeries.map((item: { title: string; desc: string }) => (
                <article
                  key={item.title}
                  className="border-t border-[#e5e7eb] pt-10"
                >
                  <h3 className="text-[22px] font-bold leading-tight text-[#102a43] md:text-[26px]">
                    {item.title}
                  </h3>

                  <p className="mt-7 text-[15px] leading-[2] text-[#34495e] md:text-[16px]">
                    {item.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <ProductCatalog />

        <div
          className="h-[350px] relative bg-cover bg-center flex flex-col items-center justify-center"
          style={{
            backgroundImage: "url('/images/products/dy.jpg')",
          }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: '#1A589BA6' }}></div>
          <div className="relative flex flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-[2.25rem] font-bold text-white">
              {page.downloadProductTitle}
            </h2>
            <a
              href="#"
              className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-3 text-base font-medium text-slate-600 shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md"
            >
              <span>{t("focusSection.moreText")}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </a>
          </div>
        </div>

        <div
          className="h-[350px] relative bg-cover bg-center flex flex-col items-center justify-center"
          style={{
            backgroundImage: "url('/images/products/yj.jpg')",
          }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: '#1A589BA6' }}></div>
          <div className="relative flex flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-[2.25rem] font-bold text-white">
              {page.downloadBrochureTitle}
            </h2>
            <a
              href="#"
              className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-3 text-base font-medium text-slate-600 shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md"
            >
              <span>{t("focusSection.moreText")}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </a>
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
