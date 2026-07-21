"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Navigation() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 50);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    const hrefWithoutLocale = href.replace(`/${locale}`, "") || "/";
    return pathWithoutLocale === hrefWithoutLocale;
  };

  const switchLanguage = (lang: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, "");
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    router.push(`/${lang}${pathWithoutLocale}${hash}`);
    setLanguageDropdownOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex-shrink-0">
            <Image
              src="/images/common/logo.png"
              alt="Logo"
              width={178}
              height={55}
              priority
              className="w-auto"
              style={{
                height: "auto",
                maxHeight: "clamp(40px, 8vw, 55px)",
              }}
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href={`/${locale}`} className={`transition ${isActive(`/${locale}`) ? "text-white text-lg font-bold" : "text-white hover:text-gray-300"}`}>
              {t("nav.home")}
            </Link>
            <Link href={`/${locale}/about`} className={`transition ${isActive(`/${locale}/about`) ? "text-white text-lg font-bold" : "text-white hover:text-gray-300"}`}>
              {t("nav.about")}
            </Link>
            <Link href={`/${locale}/products`} className={`transition ${isActive(`/${locale}/products`) ? "text-white text-lg font-bold" : "text-white hover:text-gray-300"}`}>
              {t("nav.products")}
            </Link>
            <Link href={`/${locale}/solutions`} className={`transition ${isActive(`/${locale}/solutions`) ? "text-white text-lg font-bold" : "text-white hover:text-gray-300"}`}>
              {t("nav.solutions")}
            </Link>
            <Link href={`/${locale}/cases`} className={`transition ${isActive(`/${locale}/cases`) ? "text-white text-lg font-bold" : "text-white hover:text-gray-300"}`}>
              {t("nav.cases")}
            </Link>
            <Link href={`/${locale}/news`} className={`transition ${isActive(`/${locale}/news`) ? "text-white text-lg font-bold" : "text-white hover:text-gray-300"}`}>
              {t("nav.news")}
            </Link>
            <Link href={`/${locale}/contact`} className={`transition ${isActive(`/${locale}/contact`) ? "text-white text-lg font-bold" : "text-white hover:text-gray-300"}`}>
              {t("nav.contact")}
            </Link>
            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                className="p-2 text-white hover:text-gray-300 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0016 5.5V3.935m0 2v5m0 0a2 2 0 102 2v-2m-2-2a2 2 0 10-2 2m2-2V3.935M6 17a2 2 0 100 4m0-4a2 2 0 110 4m0-4v2.945"
                  />
                </svg>
              </button>
              {languageDropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded shadow-lg overflow-hidden">
                  <button
                    onClick={() => switchLanguage("zh")}
                    className={`block w-full text-left px-4 py-2 transition ${
                      locale === "zh"
                        ? "bg-blue-600 text-white font-bold"
                        : "text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    中文
                  </button>
                  <button
                    onClick={() => switchLanguage("en")}
                    className={`block w-full text-left px-4 py-2 transition ${
                      locale === "en"
                        ? "bg-blue-600 text-white font-bold"
                        : "text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    English
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 backdrop-blur-md rounded-lg" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
            <Link
              href={`/${locale}`}
              className={`block px-4 py-2 rounded transition ${isActive(`/${locale}`) ? "text-white text-lg font-bold" : "text-white hover:text-gray-300"}`}
            >
              {t("nav.home")}
            </Link>
            <Link
              href={`/${locale}/about`}
              className={`block px-4 py-2 rounded transition ${isActive(`/${locale}/about`) ? "text-white text-lg font-bold" : "text-white hover:text-gray-300"}`}
            >
              {t("nav.about")}
            </Link>
            <Link
              href={`/${locale}/products`}
              className={`block px-4 py-2 rounded transition ${isActive(`/${locale}/products`) ? "text-white text-lg font-bold" : "text-white hover:text-gray-300"}`}
            >
              {t("nav.products")}
            </Link>
            <Link
              href={`/${locale}/solutions`}
              className={`block px-4 py-2 rounded transition ${isActive(`/${locale}/solutions`) ? "text-white text-lg font-bold" : "text-white hover:text-gray-300"}`}
            >
              {t("nav.solutions")}
            </Link>
            <Link
              href={`/${locale}/cases`}
              className={`block px-4 py-2 rounded transition ${isActive(`/${locale}/cases`) ? "text-white text-lg font-bold" : "text-white hover:text-gray-300"}`}
            >
              {t("nav.cases")}
            </Link>
            <Link
              href={`/${locale}/news`}
              className={`block px-4 py-2 rounded transition ${isActive(`/${locale}/news`) ? "text-white text-lg font-bold" : "text-white hover:text-gray-300"}`}
            >
              {t("nav.news")}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className={`block px-4 py-2 rounded transition ${isActive(`/${locale}/contact`) ? "text-white text-lg font-bold" : "text-white hover:text-gray-300"}`}
            >
              {t("nav.contact")}
            </Link>
            {/* Mobile Language Selector */}
            <div className="px-4 py-2 space-y-2">
              <p className="text-white text-sm font-semibold">语言 / Language</p>
              <button
                onClick={() => switchLanguage("zh")}
                className={`block w-full text-left px-3 py-2 rounded transition ${
                  locale === "zh"
                    ? "bg-blue-600 text-white font-bold"
                    : "text-white hover:bg-black hover:bg-opacity-50"
                }`}
              >
                中文
              </button>
              <button
                onClick={() => switchLanguage("en")}
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
        )}
      </div>
    </nav>
  );
}
