"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  hasbg?: boolean;
  scrolledPast: boolean;
  localeSwitchUrls?: Partial<Record<"zh" | "en", string>>;
};

export default function WebNavigation({
  hasbg,
  scrolledPast,
  localeSwitchUrls,
}: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [newsDropdownOpen, setNewsDropdownOpen] = useState(false);

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
      setLanguageDropdownOpen(false);
      return;
    }

    const pathWithoutLocale = pathname.replace(`/${locale}`, "");
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    router.push(`/${lang}${pathWithoutLocale}${hash}`);
    setLanguageDropdownOpen(false);
  };

  return (
    <div className="hidden md:flex items-center space-x-8">
      <Link
        href={`/${locale}`}
        className={`transition ${
          isActive(`/${locale}`)
            ? "text-white text-lg font-bold"
            : "text-white hover:text-gray-300"
        }`}
      >
        {t("nav.home")}
      </Link>
      <Link
        href={`/${locale}/about`}
        className={`transition ${
          isActive(`/${locale}/about`)
            ? "text-white text-lg font-bold"
            : "text-white hover:text-gray-300"
        }`}
      >
        {t("nav.about")}
      </Link>
      <Link
        href={`/${locale}/products`}
        className={`transition ${
          isActive(`/${locale}/products`)
            ? "text-white text-lg font-bold"
            : "text-white hover:text-gray-300"
        }`}
      >
        {t("nav.products")}
      </Link>
      <Link
        href={`/${locale}/solutions`}
        className={`transition ${
          isActive(`/${locale}/solutions`)
            ? "text-white text-lg font-bold"
            : "text-white hover:text-gray-300"
        }`}
      >
        {t("nav.solutions")}
      </Link>
      <Link
        href={`/${locale}/cases`}
        className={`transition ${
          isActive(`/${locale}/cases`)
            ? "text-white text-lg font-bold"
            : "text-white hover:text-gray-300"
        }`}
      >
        {t("nav.cases")}
      </Link>

      {/* News with Dropdown */}
      <div
        className="relative group"
        onMouseEnter={() => setNewsDropdownOpen(true)}
        onMouseLeave={() => setNewsDropdownOpen(false)}
      >
        <button
          className={`transition ${
            isActive(`/${locale}/news`)
              ? "text-white text-lg font-bold"
              : "text-white hover:text-gray-300"
          }`}
        >
          {t("nav.news")}
        </button>
        {newsDropdownOpen && (
          <div className="absolute left-0 top-full pt-2 w-56">
            <div
              className="backdrop-blur-md rounded shadow-lg overflow-hidden whitespace-nowrap"
              style={{ backgroundColor: "rgba(100, 116, 139, 0.6)" }}
            >
              <Link
                href={`/${locale}/news`}
                className="block px-4 py-2 text-white hover:bg-blue-600 transition whitespace-nowrap"
                style={{
                  backgroundColor: isActive(`/${locale}/news`)
                    ? "rgba(37, 99, 235, 1)"
                    : "rgba(100, 116, 139, 0.4)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(`/${locale}/news`)) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(100, 116, 139, 0.8)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(`/${locale}/news`)) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(100, 116, 139, 0.4)";
                  }
                }}
              >
                {t("nav.newsSubmenu.updates")}
              </Link>
              <Link
                href={`/${locale}/news/exhibitions`}
                className="block px-4 py-2 text-white hover:bg-blue-600 transition whitespace-nowrap"
                style={{
                  backgroundColor: isActive(`/${locale}/news/exhibitions`)
                    ? "rgba(37, 99, 235, 1)"
                    : "rgba(100, 116, 139, 0.4)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(`/${locale}/news/exhibitions`)) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(100, 116, 139, 0.8)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(`/${locale}/news/exhibitions`)) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(100, 116, 139, 0.4)";
                  }
                }}
              >
                {t("nav.newsSubmenu.exhibitions")}
              </Link>
            </div>
          </div>
        )}
      </div>

      <Link
        href={`/${locale}/contact`}
        className={`transition ${
          isActive(`/${locale}/contact`)
            ? "text-white text-lg font-bold"
            : "text-white hover:text-gray-300"
        }`}
      >
        {t("nav.contact")}
      </Link>

      {/* Language Dropdown - Only for Web */}
      {!hasbg && (
        <div
          className="relative group"
          onMouseEnter={() => setLanguageDropdownOpen(true)}
          onMouseLeave={() => setLanguageDropdownOpen(false)}
        >
          <button className="p-2 text-white hover:text-gray-300 transition">
            <Image
              src="/Language.svg"
              alt="Language"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </button>
          {languageDropdownOpen && (
            <div className="absolute right-0 top-full pt-1 w-32">
              <div
                className="backdrop-blur-md rounded shadow-lg overflow-hidden"
                style={{ backgroundColor: "rgba(100, 116, 139, 0.6)" }}
              >
                <button
                  onClick={() => switchLanguage("zh")}
                  className={`block w-full text-left px-4 py-2 transition ${
                    locale === "zh"
                      ? "bg-blue-600 text-white font-bold"
                      : "text-white"
                  }`}
                  style={
                    locale !== "zh"
                      ? { backgroundColor: "rgba(100, 116, 139, 0.4)" }
                      : {}
                  }
                  onMouseEnter={(e) =>
                    locale !== "zh" &&
                    (e.currentTarget.style.backgroundColor =
                      "rgba(100, 116, 139, 0.8)")
                  }
                  onMouseLeave={(e) =>
                    locale !== "zh" &&
                    (e.currentTarget.style.backgroundColor =
                      "rgba(100, 116, 139, 0.4)")
                  }
                >
                  中文
                </button>
                <button
                  onClick={() => switchLanguage("en")}
                  className={`block w-full text-left px-4 py-2 transition ${
                    locale === "en"
                      ? "bg-blue-600 text-white font-bold"
                      : "text-white"
                  }`}
                  style={
                    locale !== "en"
                      ? { backgroundColor: "rgba(100, 116, 139, 0.4)" }
                      : {}
                  }
                  onMouseEnter={(e) =>
                    locale !== "en" &&
                    (e.currentTarget.style.backgroundColor =
                      "rgba(100, 116, 139, 0.8)")
                  }
                  onMouseLeave={(e) =>
                    locale !== "en" &&
                    (e.currentTarget.style.backgroundColor =
                      "rgba(100, 116, 139, 0.4)")
                  }
                >
                  English
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
