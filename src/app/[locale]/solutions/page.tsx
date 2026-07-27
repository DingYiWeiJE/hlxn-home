import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
import type { Metadata } from "next";
import SolutionSection from "./components/SolutionSection";

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

function SolutionsContent({ locale }: { locale: string }) {
  const t = useTranslations();
  const page = t.raw("solutionsPage");

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
                  解决方案
                </h1>
                <p className="text-lg md:text-xl text-white max-w-2xl">
                  汉理新能全船型电驱推进系统方案服务商，赋能船舶零排放转型
                </p>
              </div>
            </div>
          </div>
        </div>
        <SolutionSection/>
        <Footer locale={locale} />
      </div>
    );
}

export default async function Solutions({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SolutionsContent locale={locale} />;
}
