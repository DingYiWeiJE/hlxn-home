"use client";

import dynamic from "next/dynamic";

const StrategicLayoutMap = dynamic(
  () => import("./StrategicLayoutMap"),
  {
    ssr: false,
    loading: () => (
      <section className="bg-[#f8fcff] py-16 lg:py-24">
        <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8">
          <div className="flex h-[600px] items-center justify-center rounded-lg border border-[#d9ebf8] bg-[#f8fcff] text-sm text-[#60758a]">
            {"全球战略布局地图加载中..."}
          </div>
        </div>
      </section>
    ),
  },
);

export default function StrategicLayoutMapSection({ locale = "zh" }: { locale?: string }) {
  return <StrategicLayoutMap locale={locale} />;
}
