"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { newsEmitter } from "@/lib/events";
import Dropdown from "./Dropdown";

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

  const isActive = (href: string) => {
    const pathWithoutLocale =
      pathname.replace(
        `/${locale}`,
        "",
      ) || "/";
    const hrefWithoutLocale =
      href
        .replace(`/${locale}`, "")
        .replace(/\?.*$/, "") || "/";
    return (
      pathWithoutLocale ===
      hrefWithoutLocale
    );
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

  const newsDropdownItems = [
    {
      label: "updates",
      element: (
        <button
          onClick={(e) => {
            const isNewsPage =
              pathname ===
              `/${locale}/news`;

            if (isNewsPage) {
              e.preventDefault();
              newsEmitter.emit(
                "changeNewsType",
                "DYNAMIC",
              );
            } else {
              window.location.href =
                `/${locale}/news`;
            }
          }}
          className="block w-full text-left px-4 py-2 text-white hover:bg-blue-600 transition whitespace-nowrap bg-slate-600/40"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              "rgba(100, 116, 139, 0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              "rgba(100, 116, 139, 0.4)";
          }}
        >
          {t("nav.newsSubmenu.updates")}
        </button>
      ),
    },
    {
      label: "exhibitions",
      element: (
        <button
          onClick={(e) => {
            const isNewsPage =
              pathname ===
              `/${locale}/news`;

            if (isNewsPage) {
              e.preventDefault();
              newsEmitter.emit(
                "changeNewsType",
                "EVENT",
              );
            } else {
              window.location.href =
                `/${locale}/news?type=EVENT`;
            }
          }}
          className="block w-full text-left px-4 py-2 text-white hover:bg-blue-600 transition whitespace-nowrap bg-slate-600/40"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              "rgba(100, 116, 139, 0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              "rgba(100, 116, 139, 0.4)";
          }}
        >
          {t("nav.newsSubmenu.exhibitions")}
        </button>
      ),
    },
  ];

  const languageDropdownItems = [
    {
      label: "zh",
      element: (
        <button
          onClick={() => switchLanguage("zh")}
          className={`block w-full text-left px-4 py-2 transition ${
            locale === "zh" ? "bg-blue-600 text-white font-bold" : "text-white"
          }`}
          style={
            locale !== "zh"
              ? { backgroundColor: "rgba(100, 116, 139, 0.4)" }
              : {}
          }
          onMouseEnter={(e) =>
            locale !== "zh" &&
            (e.currentTarget.style.backgroundColor = "rgba(100, 116, 139, 0.8)")
          }
          onMouseLeave={(e) =>
            locale !== "zh" &&
            (e.currentTarget.style.backgroundColor = "rgba(100, 116, 139, 0.4)")
          }
        >
          中文
        </button>
      ),
    },
    {
      label: "en",
      element: (
        <button
          onClick={() => switchLanguage("en")}
          className={`block w-full text-left px-4 py-2 transition ${
            locale === "en" ? "bg-blue-600 text-white font-bold" : "text-white"
          }`}
          style={
            locale !== "en"
              ? { backgroundColor: "rgba(100, 116, 139, 0.4)" }
              : {}
          }
          onMouseEnter={(e) =>
            locale !== "en" &&
            (e.currentTarget.style.backgroundColor = "rgba(100, 116, 139, 0.8)")
          }
          onMouseLeave={(e) =>
            locale !== "en" &&
            (e.currentTarget.style.backgroundColor = "rgba(100, 116, 139, 0.4)")
          }
        >
          English
        </button>
      ),
    },
  ];

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
      <Dropdown
        trigger={
          <button
            className={`transition ${
              isActive(`/${locale}/news`)
                ? "text-white text-lg font-bold"
                : "text-white hover:text-gray-300"
            }`}
          >
            {t("nav.news")}
          </button>
        }
        items={newsDropdownItems}
      />

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

      {/* Language Dropdown */}
      {!hasbg && (
        <Dropdown
          position="right"
          trigger={
            <button className="p-2 text-white hover:text-gray-300 transition">
              <Image
                src="/Language.svg"
                alt="Language"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </button>
          }
          items={languageDropdownItems}
        />
      )}
    </div>
  );
}
