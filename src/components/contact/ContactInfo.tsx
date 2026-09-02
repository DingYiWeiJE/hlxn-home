"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface ContactMethod {
  id: string;
  title: string;
  value: string;
}

interface CompanyInfo {
  language: string;
  address: string | null;
  contactMethods: ContactMethod[];
  brochure: {
    relativePath: string;
    filename: string;
  } | null;
}

interface ContactInfoProps {
  locale: string;
}

export default function ContactInfo({ locale }: ContactInfoProps) {
  const t = useTranslations("contactPage");
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch(
          `/api/cms/company-info?lang=${locale}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch company info");
        }

        const data = await response.json();
        setCompanyInfo(data.data || data);
      } catch (err) {
        console.error("Failed to fetch company info:", err);
        setError("无法加载联系信息");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [locale]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-[3rem] font-bold text-gray-900 mb-6">
          {t("contactInfo.title")}
        </h2>
        <div className="text-center text-gray-500">
          {locale === "zh" ? "加载中..." : "Loading..."}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-[3rem] font-bold text-gray-900 mb-6">
          {t("contactInfo.title")}
        </h2>
        <div className="text-center text-red-500">
          {locale === "zh" ? "无法加载联系信息" : "Failed to load contact information"}
        </div>
      </div>
    );
  }

  const items = companyInfo?.contactMethods || [];

  return (
    <div className="space-y-6">
      <h2 className="text-[3rem] font-bold text-gray-900 mb-6">
        {t("contactInfo.title")}
      </h2>

      {items.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <p className="text-sm font-medium text-gray-600 mb-2">
                {item.title}
              </p>
              <p className="text-lg font-semibold text-[#2463c5]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">
          {locale === "zh" ? "暂无联系方式信息" : "No contact information available"}
        </div>
      )}

      {companyInfo?.address && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {t("contactInfo.headquartersAddress")}
          </h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {companyInfo.address}
          </p>
        </div>
      )}
    </div>
  );
}
