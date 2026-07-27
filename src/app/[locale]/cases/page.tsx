import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
import type { Metadata } from "next";
import CaseList from "./components/CaseList";

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

function CasesContent({ locale }: { locale: string }) {
  const t = useTranslations();
  const page = t.raw("casesPage");

    return (
      <div className="flex min-h-screen flex-col">
        <div
          className="relative h-[60vh] bg-cover bg-center flex flex-col"
          style={{
            backgroundImage: "url('/images/cases/cases-bg.jpg')",
            backgroundAttachment: "fixed",
          }}
        >
          <div className="absolute inset-0 bg-[#001524C9] opacity-60"></div>
          <div className="relative flex flex-col h-full">
            <Navigation />
            <div className="flex-1 flex flex-col items-start justify-center">
              <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                  应用案例
                </h1>
              </div>
            </div>
          </div>
        </div>
        <CaseList/>
        <Footer locale={locale} />
      </div>
    );
}

export default async function Cases({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CasesContent locale={locale} />;
}
