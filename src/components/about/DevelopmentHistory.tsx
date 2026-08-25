"use client";

import { useState } from "react";

type HistoryEvent = {
  time: string;
  content: string;
  highlight?: boolean;
};

type HistoryItem = {
  year: number;
  image: string;
  events: HistoryEvent[];
};

const historyData: HistoryItem[] = [
  {
    year: 2014,
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop",
    events: [
      {
        time: "02",
        content: "杭州研发制造有限公司，在杭州市余杭区成立了",
        highlight: true,
      },
      {
        time: "06",
        content: "企业完成了第一个产品重要交付",
      },
      {
        time: "09",
        content: "获得了首批客户的认可与支持",
      },
    ],
  },
  {
    year: 2015,
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1600&auto=format&fit=crop",
    events: [
      {
        time: "03",
        content: "公司研发团队规模持续扩大",
        highlight: true,
      },
      {
        time: "07",
        content: "新一代核心产品正式进入研发阶段",
      },
      {
        time: "11",
        content: "完成年度重点项目交付",
      },
    ],
  },
  {
    year: 2016,
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1600&auto=format&fit=crop",
    events: [
      {
        time: "01",
        content: "建立独立产品研发中心",
        highlight: true,
      },
      {
        time: "05",
        content: "核心技术平台完成第一次升级",
      },
      {
        time: "10",
        content: "业务覆盖多个重点行业客户",
      },
    ],
  },
  {
    year: 2017,
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
    events: [
      {
        time: "04",
        content: "公司总部办公区域完成升级",
        highlight: true,
      },
      {
        time: "08",
        content: "推出多款创新产品及行业解决方案",
      },
      {
        time: "12",
        content: "年度销售额实现快速增长",
      },
    ],
  },
  {
    year: 2018,
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1600&auto=format&fit=crop",
    events: [
      {
        time: "02",
        content: "完成核心产品系列化布局",
        highlight: true,
      },
      {
        time: "06",
        content: "建立全国市场服务体系",
      },
      {
        time: "11",
        content: "获得多项行业及技术荣誉",
      },
    ],
  },
  {
    year: 2019,
    image:
      "https://images.unsplash.com/photo-1497366412874-3415097a27e7?q=80&w=1600&auto=format&fit=crop",
    events: [
      {
        time: "03",
        content: "智能制造基地正式投入运营",
        highlight: true,
      },
      {
        time: "07",
        content: "产品覆盖更多行业应用场景",
      },
      {
        time: "10",
        content: "海外市场业务正式启动",
      },
    ],
  },
  {
    year: 2020,
    image:
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=1600&auto=format&fit=crop",
    events: [
      {
        time: "01",
        content: "公司进入新一轮高速发展阶段",
        highlight: true,
      },
      {
        time: "05",
        content: "数字化研发与生产体系全面升级",
      },
      {
        time: "12",
        content: "年度业务规模再创新高",
      },
    ],
  },
];

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12h9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12H6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DevelopmentHistory() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeItem = historyData[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? historyData.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setActiveIndex((prev) =>
      prev === historyData.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <section className="relative overflow-hidden bg-[#f7f8fa] py-12 md:py-16 lg:py-20">
      {/* 右侧淡背景装饰 */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-120px] top-[160px] h-[440px] w-[320px] rotate-[-12deg] rounded-[60px] border border-slate-200/20"
      />

      <div className="relative mx-auto w-full max-w-[1200px] px-5 md:px-8">
        {/* title */}
        <h2 className="text-center text-[26px] font-bold tracking-[0.04em] text-[#111827] md:text-[32px]">
          发展历程
        </h2>

        {/* content */}
        <div className="mt-10 grid items-center gap-10 md:mt-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20">
          {/* image */}
          <div className="overflow-hidden rounded-[12px] bg-white shadow-sm">
            <img
              key={activeItem.year}
              src={activeItem.image}
              alt={`${activeItem.year} 年发展历程`}
              className="aspect-[16/9] w-full object-cover transition-all duration-500"
            />
          </div>

          {/* text */}
          <div className="lg:pl-4">
            <div
              key={activeItem.year}
              className="animate-[historyFade_.4s_ease-out]"
            >
              <div className="text-[42px] font-bold leading-none tracking-tight text-[#0759a6] md:text-[48px] lg:text-[50px]">
                {activeItem.year}
              </div>

              <div className="mt-7 space-y-5">
                {activeItem.events.map((event, index) => (
                  <div
                    key={`${activeItem.year}-${event.time}-${index}`}
                    className={[
                      "flex items-start gap-3 text-sm leading-6 md:text-[15px]",
                      event.highlight
                        ? "font-semibold text-[#0759a6]"
                        : "text-[#606b77]",
                    ].join(" ")}
                  >
                    <span className="min-w-[30px] font-semibold">
                      {event.time}:
                    </span>

                    <p>{event.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* timeline */}
        <div className="mt-12 md:mt-16 lg:mt-14">
          <div className="flex items-start gap-3 md:gap-6">
            {/* left */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="上一年"
              className="mt-[1px] flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0759a6] text-white shadow-sm transition duration-200 hover:scale-105 hover:bg-[#064d91] active:scale-95 md:h-12 md:w-12"
            >
              <ArrowLeftIcon />
            </button>

            {/* year line */}
            <div className="min-w-0 flex-1 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="relative flex min-w-[620px] items-start justify-between px-1">
                {/* horizontal line */}
                <div className="absolute left-0 right-0 top-[9px] h-px bg-[#dce4ea]" />

                {historyData.map((item, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <button
                      key={item.year}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className="group relative z-10 flex min-w-[60px] flex-col items-center"
                    >
                      <span
                        className={[
                          "block rounded-full ring-[5px] ring-[#f7f8fa] transition-all duration-300",
                          isActive
                            ? "h-[11px] w-[11px] bg-[#159bb7]"
                            : "h-[7px] w-[7px] bg-[#cbd8df] group-hover:bg-[#8fa9b7]",
                        ].join(" ")}
                      />

                      <span
                        className={[
                          "mt-4 text-[13px] transition-all duration-300",
                          isActive
                            ? "font-bold text-[#0759a6]"
                            : "font-medium text-[#9caab5]",
                        ].join(" ")}
                      >
                        {item.year}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* right */}
            <button
              type="button"
              onClick={handleNext}
              aria-label="下一年"
              className="mt-[1px] flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0759a6] text-white shadow-sm transition duration-200 hover:scale-105 hover:bg-[#064d91] active:scale-95 md:h-12 md:w-12"
            >
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes historyFade {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}