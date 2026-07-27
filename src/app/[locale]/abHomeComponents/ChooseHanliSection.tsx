import React from "react";
import { getTranslations } from "next-intl/server";

type FeatureItem = {
  title: string;
  description: string;
};

type AdvantageCard = {
  heading: string;
  bannerLines: string[];
  features: FeatureItem[];
};

type Props = {
  locale: string;
};

const FeatureBlock: React.FC<FeatureItem> = ({ title, description }) => {
  return (
    <div className="flex gap-4 sm:gap-5">
      <span
        className="mt-2.5 h-3 w-3 shrink-0 bg-blue-600 sm:mt-3 sm:h-3.5 sm:w-3.5"
        aria-hidden="true"
      />

      <div className="min-w-0">
        <h3 className="text-xl font-bold leading-snug text-slate-950 sm:text-2xl lg:text-[27px]">
          {title}
        </h3>

        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8 lg:text-[17px]">
          {description}
        </p>
      </div>
    </div>
  );
};

const AdvantageCardItem: React.FC<AdvantageCard> = ({
  heading,
  bannerLines,
  features,
}) => {
  return (
    <article className="flex h-full min-w-0 flex-col">
      {/* 固定为两行标题的高度，单行标题会垂直居中 */}
      <h2 className="mb-5 flex h-[2.5em] shrink-0 items-center justify-center text-center text-xl font-bold leading-tight text-slate-950 sm:mb-7 sm:text-2xl lg:text-[28px]">
        <span>{heading}</span>
      </h2>

      <div className="flex h-full flex-1 flex-col rounded-[18px] bg-white p-3 shadow-[0_4px_18px_rgba(15,86,138,0.14)] sm:p-3.5">
        <div className="flex min-h-28 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 px-5 py-6 text-center sm:min-h-32">
          <p className="text-xl font-bold leading-tight text-white sm:text-2xl">
            {bannerLines.map((line, index) => (
              <React.Fragment key={`${line}-${index}`}>
                {line}
                {index < bannerLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-10 px-4 pb-8 pt-7 sm:gap-12 sm:px-5 sm:pb-10 sm:pt-8 lg:gap-14 lg:px-6">
          {features.map((feature, index) => (
            <FeatureBlock
              key={`${feature.title}-${index}`}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </article>
  );
};

const ChooseHanliSection: React.FC<Props> = async ({ locale }) => {
  const t = await getTranslations({ locale });
  const cardsData = t.raw("chooseHanli.cards") as AdvantageCard[];

  return (
    <section className="bg-sky-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-[1440px]">
        <h1 className="mb-10 text-center text-3xl font-bold leading-tight tracking-wide text-blue-600 sm:mb-14 sm:text-4xl lg:mb-16 lg:text-[40px]">
          {t("chooseHanli.title")}
        </h1>

        <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 xl:grid-cols-3 xl:gap-12">
          {cardsData.map((card, index) => (
            <AdvantageCardItem
              key={`${card.heading}-${index}`}
              {...card}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChooseHanliSection;