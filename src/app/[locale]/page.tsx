import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import Navigation from "@/components/Navigation";
import HeroContent from "@/app/[locale]/abHomeComponents/HeroContent";
import type { Metadata } from "next";
import ChooseHanliSection from "./abHomeComponents/ChooseHanliSection";
import AboutHanli from "./abHomeComponents/AboutHanli";
import SolutionsSection from "./abHomeComponents/SolutionsSection";
import ProductIntroCard from "./abHomeComponents/ProductIntroCard/ProductIntroCard";
import ImageCarousel from "./abHomeComponents/carousel/ImageCarousel";
import NewsCenter from "./abHomeComponents/NewsCenter";
import SiteFooter from "@/components/SiteFooter";

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
        ? "汉理楚能 | 智能能源管理解决方案"
        : "Hanli Chuneng | Intelligent Energy Management Solutions",
    description:
      locale === "zh"
        ? "汉理楚能致力于为全球企业提供先进的能源管理技术与服务"
        : "Hanli Chuneng is committed to providing advanced energy management technology and services to enterprises worldwide",
    openGraph: {
      title:
        locale === "zh"
          ? "汉理楚能 | 智能能源管理解决方案"
          : "Hanli Chuneng | Intelligent Energy Management Solutions",
      description:
        locale === "zh"
          ? "汉理楚能致力于为全球企业提供先进的能源管理技术与服务"
          : "Hanli Chuneng is committed to providing advanced energy management technology and services to enterprises worldwide",
      type: "website",
      locale: locale === "zh" ? "zh_CN" : "en_US",
    },
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div
        className="relative h-[60vh] md:h-screen bg-cover bg-center flex flex-col"
        style={{
          backgroundImage: "url('/images/home/home-bg-1.jpg')",
          backgroundAttachment: "fixed",
        }}
      >
        {/* 黑色遮罩 */}
        <div className="absolute inset-0 bg-[#001524C9] opacity-50"></div>

        {/* 内容层 */}
        <div className="relative flex flex-col h-full">
          <Navigation />
          <HeroContent />
        </div>
      </div>
      <ChooseHanliSection locale={locale} />
      <AboutHanli locale={locale} />
      <SolutionsSection locale={locale} />
      <ProductIntroCard
        locale={locale}
        imageUrl="/images/home/electric-direct-drive.png"
        backgroundColor="white"
        imageFirst={true}
        translationKey="productCards.electricDirectDrive"
        buttonHref="/products"
      />
      <ProductIntroCard
        locale={locale}
        imageUrl="/images/home/hybrid-power-system.png"
        backgroundColor="#e7f6ff"
        imageFirst={false}
        translationKey="productCards.hybridPower"
        buttonHref="/products"
      />
      <ProductIntroCard
        locale={locale}
        imageUrl="/images/home/marine-energy-storage.png"
        backgroundColor="white"
        imageFirst={true}
        translationKey="productCards.shipEnergyStorage"
        buttonHref="/products"
      />
      <ProductIntroCard
        locale={locale}
        imageUrl="/images/home/hydrogen-fuel-system.png"
        backgroundColor="#e7f6ff"
        imageFirst={false}
        translationKey="productCards.hydrogenFuelSystem"
        buttonHref="/products"
      />
      <ProductIntroCard
        locale={locale}
        imageUrl="/images/home/methanol-fuel-system.png"
        backgroundColor="white"
        imageFirst={true}
        translationKey="productCards.methanolFuelSystem"
        buttonHref="/products"
      />

      <div className="w-full bg-[#e7f6ff] py-12 text-center pb-0">
        <h2 className="text-3xl font-bold text-[#3d71c2] ">{t("caseSection.title")}</h2>
      </div>

      <ImageCarousel
        images={[
          '/images/home/case-1.jpg',
          '/images/home/case-2.jpg',
          '/images/home/case-3.jpg',
          '/images/home/case-4.jpg',
          '/images/home/case-5.jpg',
          '/images/home/case-6.jpg',
        ]}
        imagePriorityCount={3}
      />
      
      <NewsCenter locale={locale} maxItems={3} />

      <div
        className="h-[300px] relative bg-cover bg-center flex flex-col items-center justify-center"
        style={{
          backgroundImage: "url('/images/home/home-bg-3.png')",
        }}
      >
        {/* 遮罩 */}
        <div className="absolute inset-0" style={{ backgroundColor: '#1A589BA6' }}></div>

        {/* 内容层 */}
        <div className="relative flex flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-[2.25rem] font-bold text-white">{t("focusSection.title")}</h2>
          <a
            href="#"
            className="
              inline-flex items-center gap-3
              rounded-full bg-white
              px-7 py-3
              text-base font-medium text-slate-600
              shadow-sm
              transition-all duration-200
              hover:opacity-90 hover:shadow-md
            "
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

      <SiteFooter locale={locale} />
    </div>
  );
}
