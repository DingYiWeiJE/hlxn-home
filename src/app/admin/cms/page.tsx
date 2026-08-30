"use client";

import { useState, useEffect } from "react";
import CmsBackgroundManager from "@/components/admin/cms/CmsBackgroundManager";
import CmsBrochureManager from "@/components/admin/cms/CmsBrochureManager";
import CmsPartnerManager from "@/components/admin/cms/CmsPartnerManager";
import CmsContactMethodManager from "@/components/admin/cms/CmsContactMethodManager";
import CmsCompanyAddressManager from "@/components/admin/cms/CmsCompanyAddressManager";
import CmsCompanyHonorManager from "@/components/admin/cms/CmsCompanyHonorManager";
import CmsWorkshopImageManager from "@/components/admin/cms/CmsWorkshopImageManager";

export default function CmsPage() {
  const [activeTab, setActiveTab] = useState("backgrounds");

  const tabs = [
    { id: "backgrounds", label: "背景图/视频", component: CmsBackgroundManager },
    { id: "brochures", label: "企业画册", component: CmsBrochureManager },
    { id: "partners", label: "合作伙伴", component: CmsPartnerManager },
    { id: "contact", label: "联系方式", component: CmsContactMethodManager },
    { id: "address", label: "公司地址", component: CmsCompanyAddressManager },
    { id: "honors", label: "公司荣誉", component: CmsCompanyHonorManager },
    { id: "workshop", label: "生产车间", component: CmsWorkshopImageManager },
  ];

  const activeComponent = tabs.find((tab) => tab.id === activeTab)?.component;
  const ActiveComponent = activeComponent;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CMS 内容管理</h1>
          <p className="mt-2 text-gray-600">管理官网的背景图、文档、合作伙伴等内容</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="rounded-lg bg-white p-6 shadow">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </div>
  );
}
