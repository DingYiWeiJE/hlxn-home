import { setRequestLocale, getTranslations } from "next-intl/server";
import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
import type { Metadata } from "next";
import SolutionSection from "../../../components/solutions/SolutionSection";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("solutionsPageContent.heroTitle")} | ${locale === "zh" ? "汉理新能源" : "Hanli New Energy"}`,
    description: t("solutionsPageContent.heroSubtitle"),
  };
}

async function SolutionsContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });
  const heroTitle = t("solutionsPageContent.heroTitle");
  const heroSubtitle = t("solutionsPageContent.heroSubtitle");

  return (
    <div className="flex min-h-screen flex-col">
      <div
        className="relative h-[60vh] bg-cover bg-center flex flex-col"
        style={{
          backgroundImage: "url('/images/solutions/solutions-bg.jpg')",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-[#001524C9] opacity-50"></div>
        <div className="relative flex flex-col h-full">
          <Navigation />
          <div className="flex-1 flex flex-col items-start justify-center">
            <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                {heroTitle}
              </h1>
              <p className="text-lg md:text-xl text-white max-w-2xl">
                {heroSubtitle}
              </p>
            </div>
          </div>
        </div>
      </div>
      <SolutionSection locale={locale} />
      <Footer locale={locale} />
    </div>
  );
}

export default async function Solutions({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SolutionsContent locale={locale} />;
}
