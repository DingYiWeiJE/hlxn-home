"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  localeSwitchUrls?: Partial<Record<"zh" | "en", string>>;
};

export default function MobileNavigation({
  mobileMenuOpen,
  setMobileMenuOpen,
  localeSwitchUrls,
}: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    const hrefWithoutLocale = href.replace(`/${locale}`, "") || "/";
    return pathWithoutLocale === hrefWithoutLocale;
  };

  const switchLanguage = (lang: string) => {
    const targetUrl =
      lang === "zh" || lang === "en" ? localeSwitchUrls?.[lang] : undefined;

    if (targetUrl) {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      router.push(`${targetUrl}${hash}`);
      return;
    }

    const pathWithoutLocale = pathname.replace(`/${locale}`, "");
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    router.push(`/${lang}${pathWithoutLocale}${hash}`);
  };

  if (!mobileMenuOpen) {
    return null;
  }

  return (
    <div
      className="md:hidden pb-4 space-y-2 backdrop-blur-md rounded-lg"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
    >
      <Link
        href={`/${locale}`}
        className={`block px-4 py-2 rounded transition ${
          isActive(`/${locale}`)
            ? "text-white text-lg font-bold"
            : "text-white hover:text-gray-300"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {t("nav.home")}
      </Link>
      <Link
        href={`/${locale}/about`}
        className={`block px-4 py-2 rounded transition ${
          isActive(`/${locale}/about`)
            ? "text-white text-lg font-bold"
            : "text-white hover:text-gray-300"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {t("nav.about")}
      </Link>
      <Link
        href={`/${locale}/products`}
        className={`block px-4 py-2 rounded transition ${
          isActive(`/${locale}/products`)
            ? "text-white text-lg font-bold"
            : "text-white hover:text-gray-300"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {t("nav.products")}
      </Link>
      <Link
        href={`/${locale}/solutions`}
        className={`block px-4 py-2 rounded transition ${
          isActive(`/${locale}/solutions`)
            ? "text-white text-lg font-bold"
            : "text-white hover:text-gray-300"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {t("nav.solutions")}
      </Link>
      <Link
        href={`/${locale}/cases`}
        className={`block px-4 py-2 rounded transition ${
          isActive(`/${locale}/cases`)
            ? "text-white text-lg font-bold"
            : "text-white hover:text-gray-300"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {t("nav.cases")}
      </Link>
      <Link
        href={`/${locale}/news`}
        className={`block px-4 py-2 rounded transition ${
          isActive(`/${locale}/news`)
            ? "text-white text-lg font-bold"
            : "text-white hover:text-gray-300"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {t("nav.news")}
      </Link>
      <Link
        href={`/${locale}/contact`}
        className={`block px-4 py-2 rounded transition ${
          isActive(`/${locale}/contact`)
            ? "text-white text-lg font-bold"
            : "text-white hover:text-gray-300"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {t("nav.contact")}
      </Link>

      {/* Mobile Language Selector */}
      <div className="px-4 py-2 space-y-2">
        <p className="text-white text-sm font-semibold">语言 / Language</p>
        <button
          onClick={() => {
            switchLanguage("zh");
            setMobileMenuOpen(false);
          }}
          className={`block w-full text-left px-3 py-2 rounded transition ${
            locale === "zh"
              ? "bg-blue-600 text-white font-bold"
              : "text-white hover:bg-black hover:bg-opacity-50"
          }`}
        >
          中文
        </button>
        <button
          onClick={() => {
            switchLanguage("en");
            setMobileMenuOpen(false);
          }}
          className={`block w-full text-left px-3 py-2 rounded transition ${
            locale === "en"
              ? "bg-blue-600 text-white font-bold"
              : "text-white hover:bg-black hover:bg-opacity-50"
          }`}
        >
          English
        </button>
      </div>
    </div>
  );
}
