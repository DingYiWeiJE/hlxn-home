import { setRequestLocale } from "next-intl/server";
import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
import type { Metadata } from "next";
import ContactPageClient from "@/components/contact/ContactPageClient";
import { ContactTracker } from "@/components/analytics/Tracker";

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
        ? "联系我们 | 汉理新能"
        : "Contact Us | Hanli Chuneng",
    description:
      locale === "zh"
        ? "联系汉理新能获取更多信息"
        : "Contact Hanli Chuneng for more information",
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <ContactTracker />
      <div
        className="relative h-[60vh] bg-cover bg-center flex flex-col"
        style={{
          backgroundImage: "url('/images/contact/contact-bg.png')",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-[#001524C9] opacity-50"></div>
        <div className="relative flex flex-col h-full">
          <Navigation />
          <div className="flex-1 flex flex-col items-start justify-center">
            <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8">
              <h1 className="text-[3rem] font-bold text-white mb-4">
                {locale === "zh" ? "联系我们" : "Contact Us"}
              </h1>
              <p className="text-lg md:text-xl text-white max-w-2xl">
                {locale === "zh"
                  ? "阳光、快乐、高效、至善。"
                  : "Sunshine, happiness, efficiency, and excellence."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="w-full bg-white py-12 md:py-16">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8">
          <ContactPageClient locale={locale} />
        </div>
      </section>

      <Footer locale={locale} />
    </div>
  );
}
