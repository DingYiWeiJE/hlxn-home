"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import CustomerForm from "@/components/contact/CustomerForm";
import MediaForm from "@/components/contact/MediaForm";
import EventOrganizerForm from "@/components/contact/EventOrganizerForm";
import ContactInfo from "@/components/contact/ContactInfo";

type TabType = "customer" | "media" | "eventOrganizer" | "contactInfo";

interface ContactPageClientProps {
  locale: string;
}

export default function ContactPageClient({ locale }: ContactPageClientProps) {
  const t = useTranslations("contactPage");
  const [activeTab, setActiveTab] = useState<TabType>("customer");

  const tabs: { id: TabType; label: string }[] = [
    { id: "customer", label: t("tabs.customer") },
    { id: "media", label: t("tabs.media") },
    { id: "eventOrganizer", label: t("tabs.eventOrganizer") },
    { id: "contactInfo", label: t("tabs.contactInfo") },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-4 lg:gap-6">
      {/* 标签导航 */}
      <div className="lg:col-span-1">
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#2463c5] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 表单内容 */}
      <div className="lg:col-span-3">
        {activeTab === "customer" && <CustomerForm locale={locale} />}
        {activeTab === "media" && <MediaForm locale={locale} />}
        {activeTab === "eventOrganizer" && (
          <EventOrganizerForm locale={locale} />
        )}
        {activeTab === "contactInfo" && <ContactInfo locale={locale} />}
      </div>
    </div>
  );
}
