"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import type { CompanyHistoryPublicItem } from "@/lib/company-history/types";

type Props = {
  items: CompanyHistoryPublicItem[];
  labels: {
    previous: string;
    next: string;
    scrollHint: string;
    timelineLabel: string;
    itemLabel: string;
  };
};

export default function CompanyHistoryTimeline({ items, labels }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    scrollLeft: number;
  } | null>(null);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  function updateScrollState() {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    setCanScrollPrevious(element.scrollLeft > 2);
    setCanScrollNext(
      element.scrollLeft + element.clientWidth < element.scrollWidth - 2,
    );
  }

  useEffect(() => {
    updateScrollState();
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    element.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      element.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [items.length]);

  function scrollByPage(direction: -1 | 1) {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollBy({
      left: direction * Math.max(320, element.clientWidth * 0.75),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByPage(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByPage(1);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const element = scrollRef.current;
    if (!element) {
      return;
    }

    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: element.scrollLeft,
    };
    element.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const element = scrollRef.current;
    const state = dragState.current;
    if (!element || !state || state.pointerId !== event.pointerId) {
      return;
    }

    element.scrollLeft = state.scrollLeft - (event.clientX - state.startX);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const element = scrollRef.current;
    if (element && dragState.current?.pointerId === event.pointerId) {
      element.releasePointerCapture(event.pointerId);
    }
    dragState.current = null;
  }

  return (
    <div className="relative">
      <div className="mb-5 hidden items-center justify-between gap-4 lg:flex">
        <p className="text-sm text-[#52677f]">{labels.scrollHint}</p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={labels.previous}
            disabled={!canScrollPrevious}
            onClick={() => scrollByPage(-1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#b7d8ef] bg-white text-[#2365c4] shadow-sm transition hover:bg-[#edf8ff] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={labels.next}
            disabled={!canScrollNext}
            onClick={() => scrollByPage(1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#b7d8ef] bg-white text-[#2365c4] shadow-sm transition hover:bg-[#edf8ff] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        role="list"
        aria-label={labels.timelineLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="hidden cursor-grab overflow-x-auto overscroll-x-contain pb-6 pt-8 outline-none active:cursor-grabbing focus-visible:ring-4 focus-visible:ring-blue-100 lg:block"
      >
        <div className="relative flex min-w-max gap-8 px-1">
          <div
            className="absolute left-1 right-1 top-[45px] h-px bg-[#83bee3]"
            aria-hidden="true"
          />

          {items.map((item, index) => (
            <article
              key={item.id}
              role="listitem"
              aria-label={`${labels.itemLabel} ${index + 1}: ${item.displayTime}`}
              className="relative w-[min(26rem,76vw)] shrink-0 snap-start content-visibility-auto"
            >
              <div className="mb-5 flex flex-col items-center">
                <div className="z-10 h-4 w-4 rounded-full border-4 border-white bg-[#2365c4] shadow-[0_0_0_1px_#83bee3]" />
                <time className="mt-3 rounded-full bg-white px-4 py-1 text-sm font-bold text-[#2365c4] shadow-sm">
                  {item.displayTime}
                </time>
              </div>

              <HistoryCard item={item} labels={labels} />
            </article>
          ))}
        </div>
      </div>

      <div role="list" aria-label={labels.timelineLabel} className="space-y-0 lg:hidden">
        {items.map((item, index) => (
          <article
            key={item.id}
            role="listitem"
            aria-label={`${labels.itemLabel} ${index + 1}: ${item.displayTime}`}
            className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-4 pb-8 last:pb-0"
          >
            <div className="relative flex justify-center">
              <div
                className={[
                  "absolute top-4 w-px bg-[#9dcceb]",
                  index === items.length - 1 ? "h-4" : "bottom-0",
                ].join(" ")}
                aria-hidden="true"
              />
              <div className="relative z-10 mt-1 h-4 w-4 rounded-full border-4 border-white bg-[#2365c4] shadow-[0_0_0_1px_#83bee3]" />
            </div>
            <div className="min-w-0">
              <time className="mb-3 inline-block rounded-full bg-white px-4 py-1 text-sm font-bold text-[#2365c4] shadow-sm">
                {item.displayTime}
              </time>
              <HistoryCard item={item} labels={labels} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function HistoryCard({
  item,
  labels,
}: {
  item: CompanyHistoryPublicItem;
  labels: Props["labels"];
}) {
  const imageAlt =
    item.imageAsset?.alt ||
    item.title ||
    `${item.displayTime} ${labels.itemLabel}`;

  return (
    <div className="overflow-hidden rounded-lg border border-[#cfe7f7] bg-white shadow-sm">
      <div className="p-5 md:p-6">
        {item.title ? (
          <h3 className="text-lg font-bold leading-7 text-[#07101f]">
            {item.title}
          </h3>
        ) : null}

        <div className={item.title ? "mt-3 space-y-3" : "space-y-3"}>
          {item.detailParagraphs.map((paragraph, index) => (
            <p key={index} className="text-sm leading-7 text-[#27384b] md:text-base">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {item.imageAsset ? (
        <div className="relative aspect-[4/3] bg-[#eaf7ff]">
          <Image
            src={item.imageAsset.url}
            alt={imageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}
