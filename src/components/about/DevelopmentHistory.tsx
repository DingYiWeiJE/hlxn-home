"use client";

import { useEffect, useState } from "react";

type Locale = "zh" | "en";

type HistoryEvent = {
  time: string;
  content: string;
  image: string | null;
};

type HistoryItem = {
  year: number;
  events: HistoryEvent[];
};

type Props = {
  locale: Locale;
  translations: {
    title: string;
    previous: string;
    next: string;
    emptyTitle: string;
    emptyDescription: string;
    timelineLabel: string;
  };
};

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
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
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
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

export default function DevelopmentHistory({ locale, translations }: Props) {
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch(`/api/public/company-history?locale=${locale}`, {
          cache: "no-store",
        });
        const result = await response.json();
        if (result.success) {
          setHistoryData(result.data || []);
        }
      } catch (error) {
        console.warn("Failed to load company history:", error);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [locale]);

  const hasHistory = historyData.length > 0;
  const activeItem = hasHistory ? historyData[activeIndex] : null;
  const hasEvents = activeItem && activeItem.events.length > 0;
  const activeEvent = hasEvents ? activeItem.events[activeEventIndex] : null;

  useEffect(() => {
    setActiveEventIndex(0);
  }, [activeIndex]);

  const handlePrev = () => {
    if (!hasHistory) return;
    setActiveIndex((prev) => (prev === 0 ? historyData.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (!hasHistory) return;
    setActiveIndex((prev) => (prev === historyData.length - 1 ? 0 : prev + 1));
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
        <h2 className="text-center text-[3rem] font-bold tracking-[0.04em] text-[#3060AC]">
          {translations.title}
        </h2>

        {loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          </div>
        ) : !hasHistory ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#eef3f7] text-[#a4b1bb]">
              <EmptyIcon />
            </div>

            <div className="mt-5 text-[1.2rem] font-medium text-[#4b5563]">
              {translations.emptyTitle}
            </div>

            <p className="mt-2 text-[1.2rem] text-[#9ca3af]">
              {translations.emptyDescription}
            </p>
          </div>
        ) : (
          activeItem &&
          activeEvent && (
            <>
              {/* content */}
              <div className="mt-10 grid items-center gap-10 md:mt-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20">
                {/* image */}
                <div className="overflow-hidden rounded-[12px] bg-white shadow-sm">
                  {activeEvent.image ? (
                    <img
                      key={`${activeItem.year}-${activeEventIndex}`}
                      src={activeEvent.image}
                      alt={`${activeItem.year} 年 ${activeEvent.content}`}
                      className="aspect-[16/9] w-full object-cover animate-[imageFade_.45s_ease-out]"
                    />
                  ) : (
                    <img
                      key={`${activeItem.year}-${activeEventIndex}`}
                      src="/images/common/logo_2.png"
                      alt={`${activeItem.year} 年 ${activeEvent.content}`}
                      className="aspect-[16/9] w-full object-contain bg-slate-50 animate-[imageFade_.45s_ease-out] p-8"
                    />
                  )}
                </div>

                {/* text */}
                <div className="lg:pl-4">
                  <div className="text-[42px] font-bold leading-none tracking-tight text-[#0759a6] md:text-[48px] lg:text-[50px]">
                    {activeItem.year}
                  </div>

                  <div className="mt-7 space-y-2">
                    {activeItem.events.map((event, index) => {
                      const isActive = index === activeEventIndex;

                      return (
                        <button
                          key={`${activeItem.year}-${event.time}-${index}`}
                          type="button"
                          onClick={() => setActiveEventIndex(index)}
                          className={[
                            "group flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm leading-6 transition-all duration-300 md:text-[1.2rem]",
                            isActive
                              ? "font-semibold text-[#0759a6]"
                              : "text-[#606b77] hover:text-[#0759a6]",
                          ].join(" ")}
                        >
                          {/* <span className="min-w-[30px] font-semibold">
                            
                          </span> */}

                          <span>{event.time}:{event.content}</span>
                        </button>
                      );
                    })}
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
                    aria-label={translations.previous}
                    className="mt-[1px] flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0759a6] text-white shadow-sm transition duration-200 hover:scale-105 hover:bg-[#064d91] active:scale-95 md:h-12 md:w-12"
                  >
                    <ArrowLeftIcon />
                  </button>

                  {/* year line */}
                  <div className="min-w-0 flex-1 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="relative flex min-w-[620px] items-start justify-between px-1">
                      {/* horizontal line */}
                      <div className="absolute left-0 right-0 top-[8.5px] h-px bg-[#dce4ea]" />

                      {historyData.map((item, index) => {
                        const isActive = index === activeIndex;

                        return (
                          <button
                            key={item.year}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className="group relative z-10 flex min-w-[60px] flex-col items-center"
                          >
                            {/* 固定圆点区域高度，确保所有圆点圆心水平一致 */}
                            <span className="flex h-[18px] items-center justify-center">
                              <span
                                className={[
                                  "block shrink-0 rounded-full ring-[5px] ring-[#f7f8fa] transition-all duration-300",
                                  isActive
                                    ? "h-[11px] w-[11px] bg-[#159bb7]"
                                    : "h-[7px] w-[7px] bg-[#cbd8df] group-hover:bg-[#8fa9b7]",
                                ].join(" ")}
                              />
                            </span>

                            <span
                              className={[
                                "mt-3 text-[13px] transition-all duration-300",
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
                    aria-label={translations.next}
                    className="mt-[1px] flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0759a6] text-white shadow-sm transition duration-200 hover:scale-105 hover:bg-[#064d91] active:scale-95 md:h-12 md:w-12"
                  >
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>
            </>
          )
        )}
      </div>

      <style jsx>{`
        @keyframes imageFade {
          from {
            opacity: 0;
            transform: scale(1.015);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </section>
  );
}

function EmptyIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className="h-12 w-12"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="10"
        width="32"
        height="28"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M15 18h18M15 24h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M18 32h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
