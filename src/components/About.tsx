"use client";

import { useTranslations } from "next-intl";

export default function About() {
  const t = useTranslations();

  return (
    <section id="about" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {t("about.title")}
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              {t("about.description")}
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 text-blue-600 mr-4">✓</div>
                <p className="text-gray-700">
                  {t("nav.home")}
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 text-blue-600 mr-4">✓</div>
                <p className="text-gray-700">
                  {t("nav.about")}
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 text-blue-600 mr-4">✓</div>
                <p className="text-gray-700">
                  {t("nav.products")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-700 h-96 rounded-lg shadow-lg flex items-center justify-center">
            <span className="text-white text-6xl">🏢</span>
          </div>
        </div>
      </div>
    </section>
  );
}
