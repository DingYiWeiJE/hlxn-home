import React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

type Props = {
  locale: string;
};

const AboutHanli: React.FC<Props> = async ({ locale }) => {
  const t = await getTranslations({ locale });

  return (
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1280px] text-center">
        <h2 className="text-[3rem] font-bold tracking-wide text-[#2f67bd] lg:leading-[1.2]">
          {t("aboutHanli.title")}
        </h2>

        <div className="mx-auto mt-10 max-w-[1030px] space-y-6 text-[15px] leading-8 text-slate-600 sm:mt-14 sm:text-base sm:leading-9 lg:mt-16 lg:text-[18px] lg:leading-[1.75]">
          <p>{t("aboutHanli.description1")}</p>
          <p>{t("aboutHanli.description2")}</p>
        </div>

        <Link
          href={`/${locale}/about`}
          className="group mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2f67bd] px-8 text-base font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#2459a8] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50 sm:min-h-14 sm:px-9 sm:text-lg"
        >
          <span>{t("aboutHanli.buttonText")}</span>

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
    </section>
  );
};

export default AboutHanli;
