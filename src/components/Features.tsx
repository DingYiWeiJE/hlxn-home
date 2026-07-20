"use client";

import { useTranslations } from "next-intl";

export default function Features() {
  const t = useTranslations();

  const features = [
    {
      icon: "📊",
      titleKey: "features.item1.title",
      descKey: "features.item1.description",
    },
    {
      icon: "📈",
      titleKey: "features.item2.title",
      descKey: "features.item2.description",
    },
    {
      icon: "💰",
      titleKey: "features.item3.title",
      descKey: "features.item3.description",
    },
    {
      icon: "🌱",
      titleKey: "features.item4.title",
      descKey: "features.item4.description",
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t("features.title")}
          </h2>
          <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t(feature.titleKey as any)}
              </h3>
              <p className="text-gray-600">
                {t(feature.descKey as any)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
