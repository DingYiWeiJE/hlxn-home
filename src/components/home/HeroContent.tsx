"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export default function HeroContent({locale}: {locale: string}) {
  const t = useTranslations("hero");

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-6 md:gap-8 px-4">
        {/* 第一行标题 */}
        <h1 className="text-[25px] md:text-[34px] text-white font-bold text-center">
          {t("homeTitle")}
        </h1>

        {/* 第二行副标题 */}
        <h2 className="text-[3rem] md:px-[70] text-white font-bold text-center leading-tight">
          {t("homeSubtitle")}
        </h2>
        <Link
          href={`/${locale}/solutions`}
          className="group mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2f67bd] px-8 text-base font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#2459a8] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50 sm:min-h-14 sm:px-9 sm:text-lg"
        >
          <span>{t("homeButton")}</span>

          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
          >
            <path
              d="M5 12h13M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
