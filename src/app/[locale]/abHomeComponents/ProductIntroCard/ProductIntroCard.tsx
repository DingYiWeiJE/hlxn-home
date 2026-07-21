import React from "react";
import { getTranslations } from "next-intl/server";
import IntroCard from "./IntroCard";

export type ProductIntroCardProps = {
  locale: string;
  imageUrl: string;
  imageAlt?: string;
  backgroundColor?: string;
  imageFirst?: boolean;
  translationKey: string;
  buttonHref?: string;
  className?: string;
};

const ProductIntroCard: React.FC<ProductIntroCardProps> = async ({
  locale,
  imageUrl,
  imageAlt = "Product image",
  backgroundColor = "#ffffff",
  imageFirst = true,
  translationKey,
  buttonHref = "#",
  className = "",
}) => {
  const t = await getTranslations({ locale });

  const title = t(`${translationKey}.title`);
  const description = t(`${translationKey}.description`);
  const buttonText = t(`${translationKey}.buttonText`);

  return (
    <section className="w-fullpy-12 sm:py-16 lg:py-20" style={{ backgroundColor }}>
      <div className={`mx-auto max-w-[1440px] flex flex-col lg:flex-row items-stretch lg:gap-0 ${imageFirst ? "lg:flex-row" : "lg:flex-row-reverse"} ${className}`}>
        {/* Image Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center py-8 sm:py-10 lg:py-0 lg:min-h-[520px]" >
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-auto w-full max-w-full max-h-80 sm:max-h-96 lg:max-h-[520px] object-contain"
          />
        </div>

        {/* Content Section */}
        <div className="w-full lg:w-1/2 flex items-center">
          <IntroCard
            title={title}
            description={description}
            buttonText={buttonText}
            buttonHref={buttonHref}
          />
        </div>
      </div>
    </section>
  );
};

export default ProductIntroCard;
