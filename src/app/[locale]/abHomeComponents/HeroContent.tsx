"use client";

import { useTranslations } from "next-intl";

export default function HeroContent() {
  const t = useTranslations("hero");

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-6 md:gap-8 px-4">
        {/* 第一行标题 */}
        <h1 className="text-[25px] md:text-[34px] text-white font-bold text-center">
          {t("homeTitle")}
        </h1>

        {/* 第二行副标题 */}
        <h2 className="text-[33px] md:text-[70px] text-white font-bold text-center leading-tight">
          {t("homeSubtitle")}
        </h2>

        {/* 第三行按钮 */}
        <button className="mt-4 px-8 py-3 rounded-full bg-[#2a62bb] text-white text-[15px] font-medium transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/50 flex items-center gap-2">
          {t("homeButton")}
          <svg
            aria-hidden="true"
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
            viewBox="0 0 448 512"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <path d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
