"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { newsEmitter } from "@/lib/events";
import { solutionEmitter } from "@/lib/solutions-events";
import Dropdown from "./Dropdown";

type Props = {
  hasbg?: boolean;
  scrolledPast: boolean;
  isWhiteBg: boolean;
  localeSwitchUrls?: Partial<Record<"zh" | "en", string>>;
};

type SolutionCategory = {
  id: string;
  chName: string;
  enName: string;
};

export default function WebNavigation({
  hasbg,
  scrolledPast,
  isWhiteBg,
  localeSwitchUrls,
}: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [categories, setCategories] = useState<SolutionCategory[]>([]);

  const textColor = isWhiteBg ? "text-black" : "text-white";
  const hoverTextColor = isWhiteBg ? "hover:text-gray-700" : "hover:text-gray-300";
  const activeTextColor = isWhiteBg ? "text-black" : "text-white";

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

  // 加载解决方案分类
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/admin/solution-categories", {
          credentials: "include",
        });
        const result = await response.json();
        if (result.success && result.data?.categories) {
          setCategories(result.data.categories);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }

    fetchCategories();
  }, []);

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

  const solutionDropdownItems = [
    {
      label: "all",
      element: (
        <button
          onClick={(e) => {
            const isSolutionsPage =
              pathname ===
              `/${locale}/solutions`;

            if (isSolutionsPage) {
              e.preventDefault();
              solutionEmitter.emit(
                "changeSolutionCategory",
                null,
              );
            } else {
              window.location.href =
                `/${locale}/solutions`;
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
          {t("nav.solutionsSubmenu.allCategories")}
        </button>
      ),
    },
    ...categories.map((category) => ({
      label: category.id,
      element: (
        <button
          key={category.id}
          onClick={(e) => {
            const isSolutionsPage =
              pathname ===
              `/${locale}/solutions`;

            if (isSolutionsPage) {
              e.preventDefault();
              solutionEmitter.emit(
                "changeSolutionCategory",
                category.id,
              );
            } else {
              window.location.href =
                `/${locale}/solutions?category=${category.id}`;
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
          {locale === "zh" ? category.chName : category.enName}
        </button>
      ),
    })),
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
            ? `${activeTextColor} text-lg font-bold`
            : `${textColor} ${hoverTextColor}`
        }`}
      >
        {t("nav.home")}
      </Link>
      <Link
        href={`/${locale}/about`}
        className={`transition ${
          isActive(`/${locale}/about`)
            ? `${activeTextColor} text-lg font-bold`
            : `${textColor} ${hoverTextColor}`
        }`}
      >
        {t("nav.about")}
      </Link>
      <Link
        href={`/${locale}/products`}
        className={`transition ${
          isActive(`/${locale}/products`)
            ? `${activeTextColor} text-lg font-bold`
            : `${textColor} ${hoverTextColor}`
        }`}
      >
        {t("nav.products")}
      </Link>

      {/* Solutions with Dropdown */}
      <Dropdown
        trigger={
          <button
            className={`transition ${
              isActive(`/${locale}/solutions`)
                ? `${activeTextColor} text-lg font-bold`
                : `${textColor} ${hoverTextColor}`
            }`}
          >
            {t("nav.solutions")}
          </button>
        }
        items={solutionDropdownItems}
      />

      <Link
        href={`/${locale}/cases`}
        className={`transition ${
          isActive(`/${locale}/cases`)
            ? `${activeTextColor} text-lg font-bold`
            : `${textColor} ${hoverTextColor}`
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
                ? `${activeTextColor} text-lg font-bold`
                : `${textColor} ${hoverTextColor}`
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
            ? `${activeTextColor} text-lg font-bold`
            : `${textColor} ${hoverTextColor}`
        }`}
      >
        {t("nav.contact")}
      </Link>

      {/* Language Dropdown */}
      {!hasbg && (
        <Dropdown
          position="right"
          trigger={
            <button className={`p-2 ${textColor} ${hoverTextColor} transition`}>
              <svg
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                className="w-6 h-6"
                fill="currentColor"
              >
                <path d="M136.021333 668.032c26.581333 0 47.872 22.826667 47.872 50.56v47.104c0 47.786667 34.56 87.082667 78.933334 90.709333l6.613333 0.256h88.789333c26.581333 0 47.786667 22.826667 47.786667 50.517334 0 27.733333-21.205333 50.56-47.786667 50.56H269.354667c-100.181333 0-181.12-86.186667-181.12-192v-47.146667c0-27.733333 21.248-50.56 47.786666-50.56z m607.146667-235.776c10.538667 0 19.968 6.826667 23.808 17.066667l1.706667 4.522666h-0.042667l176.085333 466.901334a28.202667 28.202667 0 0 1-2.56 25.088v-0.042667a25.258667 25.258667 0 0 1-21.290666 11.946667h-47.957334a25.728 25.728 0 0 1-23.765333-17.066667v-0.042667l-46.848-124.373333H625.066667l-46.805334 124.373333a25.728 25.728 0 0 1-23.808 17.109334h-47.829333a25.386667 25.386667 0 0 1-21.248-12.032v0.042666a28.202667 28.202667 0 0 1-2.56-24.917333l177.792-471.552a25.642667 25.642667 0 0 1 23.722667-17.066667h58.837333z m-80 282.965333h101.12l-50.517333-133.973333-50.602667 133.973333zM291.584 55.04c6.826667 0 13.354667 2.901333 18.133333 7.978667 4.821333 5.12 7.466667 11.946667 7.466667 18.986666V149.333333H469.333333c14.336 0 25.6 12.202667 25.6 26.88v282.965334c0 14.677333-11.306667 26.965333-25.6 26.965333H317.184v114.517333c0 14.677333-11.306667 26.88-25.6 26.88H247.125333c-14.293333 0-25.6-12.202667-25.6-26.88v-114.517333H69.376a24.917333 24.917333 0 0 1-14.293333-4.650667l-3.84-3.370666a27.733333 27.733333 0 0 1-7.466667-18.986667v-282.88c0-7.125333 2.688-13.952 7.424-18.986667a25.088 25.088 0 0 1 18.133333-7.936h152.192v-67.413333c0-7.04 2.688-13.994667 7.509334-18.986667a25.045333 25.045333 0 0 1 18.090666-7.936h44.458667z m422.186667 47.146667c100.181333 0 181.12 86.186667 181.12 192V341.333333c0 27.733333-21.248 50.474667-47.872 50.517334-26.538667 0-47.786667-22.826667-47.786667-50.517334V294.229333c0-24.234667-8.96-47.36-25.045333-64.341333h-0.042667a83.072 83.072 0 0 0-51.925333-26.154667l-8.448-0.426666h-88.874667c-26.624 0-47.786667-22.826667-47.786667-50.517334 0-27.733333 21.162667-50.517333 47.786667-50.56h85.504v-0.042666h3.370667zM317.184 385.152h82.858667V250.453333H317.184v134.741334z m-177.792 0h82.858667V250.453333H139.392v134.741334z" />
              </svg>
            </button>
          }
          items={languageDropdownItems}
        />
      )}
    </div>
  );
}
