import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
import type { Metadata } from "next";
import Image from "next/image";
import ProductCatalog from "../../../components/products/ProductCatalog";
import { DownloadBanner } from "@/components/DownloadBanner";

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
      <div className="relative flex h-[60vh] flex-col overflow-hidden">
        <Image
          src="/images/products/product_bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-[#001524]/50" />

        <div className="relative z-10 flex h-full flex-col">
          <Navigation />

          <div className="flex flex-1 flex-col items-start justify-center">
            <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8">
              <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
                {page.heroTitle}
              </h1>

              <p className="max-w-2xl text-lg text-white md:text-xl">
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
        {/* <DownloadBanner
          image="/images/products/dy.jpg"
          title={page.downloadProductTitle}
          buttonText={t("focusSection.moreText")}
          priority
        /> */}

        <DownloadBanner
          image="/images/products/yj.jpg"
          title={page.downloadBrochureTitle}
          priority
          buttonText={t("focusSection.moreText")}
        />

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
