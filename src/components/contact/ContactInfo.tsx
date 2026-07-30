"use client";

import { useTranslations } from "next-intl";

const CONTACT_NUMBERS = {
  general: "027-86660081",
  sales: "027-86660081",
  supplyChain: "027-86660081",
  afterSales: "027-86660081",
  recruitment: "027-86660081",
  brandMedia: "027-86660081",
  feedback: "027-86660081",
  feedbackEmail: "feedback@hanlyenergy.com",
  antiCorruption: "027-86660081",
  antiCorruptionEmail: "integrity@hanlyenergy.com",
};

export default function ContactInfo() {
  const t = useTranslations("contactPage");

  const items = [
    { label: t("contactInfo.generalPhone"), value: CONTACT_NUMBERS.general },
    { label: t("contactInfo.salesPhone"), value: CONTACT_NUMBERS.sales },
    {
      label: t("contactInfo.supplyChainProcurement"),
      value: CONTACT_NUMBERS.supplyChain,
    },
    {
      label: t("contactInfo.afterSalesService"),
      value: CONTACT_NUMBERS.afterSales,
    },
    { label: t("contactInfo.recruitment"), value: CONTACT_NUMBERS.recruitment },
    { label: t("contactInfo.brandMedia"), value: CONTACT_NUMBERS.brandMedia },
    { label: t("contactInfo.feedbackPhone"), value: CONTACT_NUMBERS.feedback },
    {
      label: t("contactInfo.feedbackEmail"),
      value: CONTACT_NUMBERS.feedbackEmail,
    },
    {
      label: t("contactInfo.antiCorruption"),
      value: CONTACT_NUMBERS.antiCorruption,
    },
    {
      label: t("contactInfo.antiCorruptionEmail"),
      value: CONTACT_NUMBERS.antiCorruptionEmail,
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {t("contactInfo.title")}
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium text-gray-600 mb-2">
              {item.label}
            </p>
            <p className="text-lg font-semibold text-[#2463c5]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          总部地址
        </h3>
        <p className="text-gray-700 leading-relaxed">
          湖北省武汉市武昌区友谊大道与铁机路交汇处北侧武汉中交大厦B座九层
        </p>
        <p className="text-gray-700 mt-2">
          周一至周五 09:00 - 18:00
        </p>
      </div>
    </div>
  );
}
