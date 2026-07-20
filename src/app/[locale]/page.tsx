import { setRequestLocale } from "next-intl/server";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import About from "@/components/About";
import Contact from "@/components/Contact";
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow">
        <Hero />
        <Features />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
