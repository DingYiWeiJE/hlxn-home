"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useState } from "react";

export default function Navigation() {
  const t = useTranslations();
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const otherLocale = locale === "zh" ? "en" : "zh";

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex-shrink-0">
            <span className="text-2xl font-bold text-blue-600">汉理楚能</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href={`/${locale}`} className="text-gray-700 hover:text-blue-600 transition">
              {t("nav.home")}
            </Link>
            <Link href={`/${locale}#about`} className="text-gray-700 hover:text-blue-600 transition">
              {t("nav.about")}
            </Link>
            <Link href={`/${locale}#features`} className="text-gray-700 hover:text-blue-600 transition">
              {t("nav.products")}
            </Link>
            <Link href={`/${locale}#contact`} className="text-gray-700 hover:text-blue-600 transition">
              {t("nav.contact")}
            </Link>
            <Link
              href={`/${otherLocale}`}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-blue-600 hover:text-white transition"
            >
              {locale === "zh" ? "EN" : "中文"}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
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
          <div className="md:hidden pb-4 space-y-2">
            <Link
              href={`/${locale}`}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              {t("nav.home")}
            </Link>
            <Link
              href={`/${locale}#about`}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              {t("nav.about")}
            </Link>
            <Link
              href={`/${locale}#features`}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              {t("nav.products")}
            </Link>
            <Link
              href={`/${locale}#contact`}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              {t("nav.contact")}
            </Link>
            <Link
              href={`/${otherLocale}`}
              className="block px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-blue-600 hover:text-white transition"
            >
              {locale === "zh" ? "English" : "中文"}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
