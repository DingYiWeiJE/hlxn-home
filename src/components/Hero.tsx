"use client";

import { useTranslations } from "next-intl";

export default function Hero() {
  const t = useTranslations();

  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {t("hero.title")}
          </h1>
          <p className="text-xl md:text-2xl mb-4 opacity-90">
            {t("hero.subtitle")}
          </p>
          <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
            {t("hero.description")}
          </p>
          <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition duration-300 shadow-lg">
            {t("hero.cta")}
          </button>
        </div>
      </div>
    </section>
  );
}
