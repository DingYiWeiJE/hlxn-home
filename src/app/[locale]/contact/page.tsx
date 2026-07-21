import { setRequestLocale } from "next-intl/server";
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
        ? "联系我们 | 汉理楚能"
        : "Contact Us | Hanli Chuneng",
    description:
      locale === "zh"
        ? "联系汉理楚能获取更多信息"
        : "Contact Hanli Chuneng for more information",
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow">
      </main>
      <Footer locale={locale} />
    </div>
  );
}
