"use client";

import dynamic from "next/dynamic";

const CustomerDistributionMap = dynamic(
  () => import("./CustomerDistributionMap"),
  {
    ssr: false,
    loading: () => (
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8">
          <div className="flex h-[600px] items-center justify-center rounded-lg border border-[#d9ebf8] bg-[#f8fcff] text-sm text-[#60758a]">
            {"\u5ba2\u6237\u5206\u5e03\u5730\u56fe\u52a0\u8f7d\u4e2d..."}
          </div>
        </div>
      </section>
    ),
  },
);

export default function CustomerDistributionMapSection() {
  return <CustomerDistributionMap />;
}

