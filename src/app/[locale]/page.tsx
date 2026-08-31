import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import Navigation from "@/components/Navigation";
import HeroContent from "@/components/home/HeroContent";
import type { Metadata } from "next";
import ChooseHanliSection from "@/components/home/ChooseHanliSection";
import AboutHanli from "@/components/home/AboutHanli";
import SolutionsSection from "@/components/home/SolutionsSection";
import ProductIntroCard from "@/components/home/ProductIntroCard/ProductIntroCard";
import ImageCarousel from "@/components/home/carousel/ImageCarousel";
import NewsCenter from "@/components/home/NewsCenter";
import { PartnerSection } from "@/components/home/PartnerSection";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  locale: "zh" | "en";
  coverImage?: {
    url: string;
  } | null;
  summaryParagraphs?: string[];
};

async function fetchProducts(
  locale: string
): Promise<Product[]> {
  if (locale !== "zh" && locale !== "en") {
    return [];
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const apiUrl = `${baseUrl}/api/products?locale=${locale}&pageSize=5`;

    console.log(`[HomePage] 开始获取产品，URL=${apiUrl}`);

    const response = await fetch(apiUrl, {
      cache: "no-store",
      next: { revalidate: 0 }
    });

    console.log(`[HomePage] 产品 API 响应状态=${response.status}`);

    if (!response.ok) {
      console.error(`[HomePage] 产品 API 失败，状态=${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data.data?.items || !Array.isArray(data.data.items)) {
      return [];
    }

    return data.data.items.map((product: any) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      locale: product.locale,
      coverImage: product.coverImage,
      summaryParagraphs: Array.isArray(product.summaryParagraphs)
        ? product.summaryParagraphs.filter(
            (paragraph: any): paragraph is string => typeof paragraph === "string",
          )
        : [],
    }));
  } catch (error) {
    console.error(`[HomePage] 获取产品异常:`, error);
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title:
      locale === "zh"
        ? "汉理新能 | 专注新能源动力系统解决方案"
        : "Hanli Chuneng | Intelligent Energy Management Solutions",
    description:
      locale === "zh"
        ? "汉理新能致力于为全球企业提供先进的能源管理技术与服务"
        : "Hanli Chuneng is committed to providing advanced energy management technology and services to enterprises worldwide",
    openGraph: {
      title:
        locale === "zh"
          ? "汉理新能 | 专注新能源动力系统解决方案"
          : "Hanli Chuneng | Intelligent Energy Management Solutions",
      description:
        locale === "zh"
          ? "汉理新能致力于为全球企业提供先进的能源管理技术与服务"
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

  const products = await fetchProducts(locale);

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
          <HeroContent  locale={locale} />
        </div>
      </div>
      <ChooseHanliSection locale={locale} />
      <AboutHanli locale={locale} />
      <SolutionsSection locale={locale} />
      {products.map((product, index) => (
        <ProductIntroCard
          key={product.id}
          locale={locale}
          imageUrl={product.coverImage?.url || "/images/placeholder.png"}
          backgroundColor={index % 2 === 0 ? "white" : "#e7f6ff"}
          imageFirst={index % 2 === 0}
          translationKey="productCards.placeholder"
          buttonHref={`/${locale}/products/${product.slug}`}
          productName={product.name}
          productSummary={
            Array.isArray(product.summaryParagraphs)
              ? product.summaryParagraphs[0]
              : ""
          }
        />
      ))}

      <div className="w-full bg-[#e7f6ff] py-12 text-center pb-0">
        <h2 className="text-[3rem] font-bold text-[#3d71c2] ">{t("caseSection.title")}</h2>
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

      <PartnerSection locale={locale} />

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
          <h2 className="text-[3rem] font-bold text-white">{t("focusSection.title")}</h2>
          <a
            href={`/${locale}/solutions`}
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
