import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { locales } from "@/i18n";
import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await params;
  const isValidLocale = locales.includes(locale as any);

  if (!isValidLocale) notFound();

  return {
    title: locale === "zh" ? "汉理楚能 | 智能能源管理解决方案" : "Hanli Chuneng | Intelligent Energy Management Solutions",
    description:
      locale === "zh"
        ? "汉理楚能致力于为全球企业提供先进的能源管理技术与服务"
        : "Hanli Chuneng is committed to providing advanced energy management technology and services to enterprises worldwide",
    alternates: {
      languages: {
        zh: "https://gitee.io/hanlichuneng/zh/",
        en: "https://gitee.io/hanlichuneng/en/",
      },
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await import(`@/messages/${locale}.json`).then(
    (m) => m.default
  );

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}
