import { setRequestLocale } from "next-intl/server";
import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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
        ? "隐私政策 | 汉理新能源"
        : "Privacy Policy | Hanli New Energy",
    description:
      locale === "zh"
        ? "了解汉理新能源的隐私政策和数据保护实践"
        : "Learn about Hanli New Energy's privacy policy and data protection practices",
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const tPolicy = t.raw("privacyPolicy") as any;

  const contentSections = [
    {
      key: "information",
      title: tPolicy.sections.information.title,
      content: tPolicy.sections.information.content,
    },
    {
      key: "usage",
      title: tPolicy.sections.usage.title,
      content: tPolicy.sections.usage.content,
    },
    {
      key: "sharing",
      title: tPolicy.sections.sharing.title,
      content: tPolicy.sections.sharing.content,
    },
    {
      key: "security",
      title: tPolicy.sections.security.title,
      content: tPolicy.sections.security.content,
    },
    {
      key: "retention",
      title: tPolicy.sections.retention.title,
      content: tPolicy.sections.retention.content,
    },
    {
      key: "rights",
      title: tPolicy.sections.rights.title,
      content: tPolicy.sections.rights.content,
    },
    {
      key: "cookies",
      title: tPolicy.sections.cookies.title,
      content: tPolicy.sections.cookies.content,
    },
    {
      key: "changes",
      title: tPolicy.sections.changes.title,
      content: tPolicy.sections.changes.content,
    },
    {
      key: "contact",
      title: tPolicy.sections.contact.title,
      content: tPolicy.sections.contact.content,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* 导航栏 */}
      <Navigation />

      {/* 主要内容 */}
      <main className="flex-1 w-full bg-white">
        {/* Hero Section */}
        <section className="relative h-[40vh] bg-gradient-to-r from-[#001524] to-[#003d82] flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
            <div className="absolute -bottom-8 right-20 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          </div>

          <div className="relative z-10 text-center px-6 max-w-3xl">
            <h1 className="text-[3rem] font-bold text-white mb-4">
              {tPolicy.title}
            </h1>
            <p className="text-lg md:text-xl text-blue-100">
              {locale === "zh"
                ? "我们致力于保护您的隐私和个人信息"
                : "We are committed to protecting your privacy and personal information"}
            </p>
          </div>
        </section>

        {/* 内容区域 */}
        <section className="w-full py-12 md:py-20 px-6">
          <div className="max-w-4xl mx-auto">
            {/* 介绍段落 */}
            <div className="mb-12 p-6 bg-blue-50 rounded-xl border-l-4 border-blue-500">
              <p className="text-gray-700 leading-relaxed text-lg">
                {tPolicy.introduction}
              </p>
              <p className="text-sm text-gray-600 mt-4">
                {tPolicy.lastUpdated}：2026年7月30日
              </p>
            </div>

            {/* 政策部分 */}
            <div className="space-y-8">
              {contentSections.map((section, index) => (
                <div key={section.key} className="scroll-mt-20">
                  <div className="mb-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white font-semibold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-[3rem] font-bold text-gray-900 mb-4">
                          {section.title}
                        </h2>
                        <div className="space-y-3">
                          {Array.isArray(section.content) &&
                            section.content.map((item: string, idx: number) => (
                              <div key={idx} className="flex gap-3 text-gray-700">
                                <span className="text-blue-500 font-semibold flex-shrink-0 mt-0.5">
                                  •
                                </span>
                                <p className="leading-relaxed">{item}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < contentSections.length - 1 && (
                    <div className="my-8 border-t border-gray-200"></div>
                  )}
                </div>
              ))}
            </div>

            {/* 接受声明 */}
            <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-700 leading-relaxed">
                {tPolicy.acceptanceNote}
              </p>
            </div>

            {/* 返回按钮 */}
            <div className="mt-12 flex justify-center">
              <a
                href={`/${locale}/contact`}
                className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {tPolicy.backToContact}
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <Footer locale={locale} />
    </div>
  );
}
