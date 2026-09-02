// components/carousel/Carousel3DClient.tsx
// 3D 立体轮播：中间图片居中放大，越靠外的图片越小、越暗，
// 由近到远层次递减，并互相叠加；容器裁切出两侧图片「探出一截」的效果。
// 移动端额外叠加轻微旋转制造纵深感，桌面端左右展开更多张、整体更扁平。

"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from "react";

import type { CarouselImage } from "./ImageCarousel";

type Carousel3DClientProps = {
  images: CarouselImage[];
  className?: string;
  imagePriorityCount?: number;
  imageFit?: "cover" | "contain";
  imageAspectRatio?: string;
  autoplay?: boolean;
  autoplayInterval?: number;
};

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";
const SWIPE_THRESHOLD = 40;
const TRANSITION_DURATION = 600;

type SlideMetrics = {
  // 两侧完全可见的图片层数（不含用于淡出动画的缓冲层）
  visibleOffset: number;
  centerWidthPercent: number;
  stepPercent: number;
  // 每远离中心一层，额外递减的缩放比例：越远越小
  scaleStep: number;
  // 缩放最低不低于该值，避免最外层过小
  minScale: number;
  // 每远离中心一层，额外递增的黑色蒙层不透明度：越远越暗
  overlayOpacityStep: number;
  // 蒙层不透明度上限
  maxOverlayOpacity: number;
  rotateDeg: number;
};

// 移动端：只展开左右各 1 张，紧贴中间图片边缘探出一小截。
const MOBILE_METRICS: SlideMetrics = {
  visibleOffset: 1,
  centerWidthPercent: 66,
  stepPercent: 33,
  scaleStep: 0.22,
  minScale: 0.6,
  overlayOpacityStep: 0.35,
  maxOverlayOpacity: 0.6,
  rotateDeg: 34,
};

// 桌面端：左右展开更多张（各 2 张），整体扁平、无旋转，
// 越靠外的图片越小、越暗，制造由近到远的层次感；
// 两侧最外层还会被容器裁切出一截。
const DESKTOP_METRICS: SlideMetrics = {
  visibleOffset: 2,
  centerWidthPercent: 38,
  stepPercent: 24,
  scaleStep: 0.17,
  minScale: 0.5,
  overlayOpacityStep: 0.28,
  maxOverlayOpacity: 0.65,
  rotateDeg: 0,
};

// 把 "210 / 297" 这类 CSS aspect-ratio 字符串解析成 宽/高 数值。
function parseAspectRatio(value: string): number {
  const [widthPart, heightPart] = value.split("/");
  const width = Number.parseFloat(widthPart ?? "");
  const height = Number.parseFloat(heightPart ?? "");

  if (Number.isFinite(width) && Number.isFinite(height) && height > 0) {
    return width / height;
  }

  return 1;
}

function normalizeIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function getShortestOffset(
  index: number,
  activeIndex: number,
  length: number,
) {
  let offset = index - activeIndex;
  const half = length / 2;

  if (offset > half) offset -= length;
  if (offset < -half) offset += length;

  return offset;
}

export default function Carousel3DClient({
  images,
  className = "",
  imagePriorityCount = 1,
  imageFit = "cover",
  imageAspectRatio = "16 / 10",
  autoplay = true,
  autoplayInterval = 3500,
}: Carousel3DClientProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const imageCount = images.length;
  const canSlide = imageCount > 1;
  const metrics = isDesktop ? DESKTOP_METRICS : MOBILE_METRICS;
  // 多渲染一层用于淡出动画，避免图片超出可见范围时直接消失。
  const renderRange = metrics.visibleOffset + 1;

  // 容器的宽高比不能直接用图片本身的宽高比：中间图片只占容器宽度的
  // centerWidthPercent%，如果容器整体也按图片比例来算高度，会比实际
  // 可见内容高出很多，在图片上下留出大片空白。这里反过来，按“中间图片
  // 缩放后的宽度”换算出容器应有的宽高比。
  const imageRatio = parseAspectRatio(imageAspectRatio);
  const containerAspectRatio =
    imageRatio * (100 / metrics.centerWidthPercent);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

    const update = () => setIsDesktop(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const stopAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!autoplay || !canSlide) {
      stopAutoplay();
      return;
    }

    autoplayTimerRef.current = setInterval(() => {
      setIsAnimating(true);
      setActiveIndex((previous) => normalizeIndex(previous + 1, imageCount));
    }, autoplayInterval);

    return stopAutoplay;
  }, [autoplay, autoplayInterval, canSlide, imageCount, stopAutoplay]);

  const goToPrevious = useCallback(() => {
    if (!canSlide) return;

    stopAutoplay();
    setIsAnimating(true);
    setActiveIndex((previous) => normalizeIndex(previous - 1, imageCount));
  }, [canSlide, imageCount, stopAutoplay]);

  const goToNext = useCallback(() => {
    if (!canSlide) return;

    stopAutoplay();
    setIsAnimating(true);
    setActiveIndex((previous) => normalizeIndex(previous + 1, imageCount));
  }, [canSlide, imageCount, stopAutoplay]);

  const goToImage = useCallback(
    (index: number) => {
      if (!canSlide) return;

      stopAutoplay();
      setIsAnimating(true);
      setActiveIndex(normalizeIndex(index, imageCount));
    },
    [canSlide, imageCount, stopAutoplay],
  );

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchCurrentX.current = touchStartX.current;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    touchCurrentX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchCurrentX.current === null) {
      return;
    }

    const distance = touchStartX.current - touchCurrentX.current;

    if (Math.abs(distance) >= SWIPE_THRESHOLD) {
      if (distance > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }

    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  if (imageCount === 0) {
    return null;
  }

  return (
    <section
      className={["w-full py-6 sm:py-8 lg:py-10", className].join(" ")}
      aria-label="3D 图片轮播"
      aria-roledescription="carousel"
    >
      <div className="relative mx-auto max-w-[1440px]">
        <div
          className="relative mx-auto overflow-hidden"
          style={{
            aspectRatio: containerAspectRatio,
            perspective: "1600px",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {images.map((image, index) => {
            const offset = getShortestOffset(index, activeIndex, imageCount);
            const distance = Math.abs(offset);

            if (distance > renderRange) {
              return null;
            }

            const direction = Math.sign(offset);
            const isBuffer = distance > metrics.visibleOffset;

            const scale = Math.max(
              metrics.minScale,
              1 - distance * metrics.scaleStep,
            );
            const overlayOpacity = Math.min(
              metrics.maxOverlayOpacity,
              distance * metrics.overlayOpacityStep,
            );
            const opacity = isBuffer ? 0 : 1;
            const translateX = offset * metrics.stepPercent;
            const rotateY = -direction * metrics.rotateDeg;
            const zIndex = 100 - distance;

            return (
              <div
                key={image.src}
                role={offset === 0 ? undefined : "button"}
                tabIndex={offset === 0 ? -1 : 0}
                aria-label={
                  offset === 0 ? undefined : `切换到第 ${index + 1} 张图片`
                }
                aria-hidden={offset !== 0}
                onClick={() => {
                  if (offset !== 0) goToImage(index);
                }}
                onKeyDown={(event) => {
                  if (offset !== 0 && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    goToImage(index);
                  }
                }}
                className={[
                  "absolute overflow-hidden rounded-xl shadow-2xl",
                  imageFit === "contain" ? "bg-white" : "bg-slate-900",
                  offset === 0 ? "cursor-default" : "cursor-pointer",
                ].join(" ")}
                style={{
                  // left 的百分比相对父容器解析，用来把每一层正确地
                  // 展开到容器宽度的对应比例；translate(-50%, -50%) 是
                  // 相对元素自身尺寸解析，只用于把该定位点重新居中。
                  left: `calc(50% + ${translateX}%)`,
                  top: "50%",
                  width: `${metrics.centerWidthPercent}%`,
                  aspectRatio: imageAspectRatio,
                  zIndex,
                  pointerEvents: isBuffer ? "none" : undefined,
                  transform: `translate(-50%, -50%) scale(${scale}) rotateY(${rotateY}deg)`,
                  transition: isAnimating
                    ? `left ${TRANSITION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${TRANSITION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${TRANSITION_DURATION}ms ease-out`
                    : "none",
                  opacity,
                }}
                onTransitionEnd={() => {
                  if (offset === 0) setIsAnimating(false);
                }}
              >
                <Image
                  src={image.src}
                  alt={image.alt ?? ""}
                  fill
                  priority={index < imagePriorityCount}
                  sizes={isDesktop ? "45vw" : "70vw"}
                  className={
                    imageFit === "contain" ? "object-contain" : "object-cover"
                  }
                  draggable={false}
                />
                {offset !== 0 && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}

          <Carousel3DArrow
            direction="previous"
            onClick={goToPrevious}
            disabled={!canSlide}
          />
          <Carousel3DArrow
            direction="next"
            onClick={goToNext}
            disabled={!canSlide}
          />
        </div>
      </div>

      {canSlide && (
        <div
          className="mt-5 flex items-center justify-center gap-3 lg:mt-6"
          role="tablist"
          aria-label="选择轮播图片"
        >
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={`${image.src}-indicator-${index}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`切换到第 ${index + 1} 张图片`}
                onClick={() => goToImage(index)}
                className={[
                  "h-2.5 w-2.5 rounded-full",
                  "transition-all duration-300",
                  "focus-visible:outline-none",
                  "focus-visible:ring-2",
                  "focus-visible:ring-blue-500",
                  "focus-visible:ring-offset-2",
                  isActive
                    ? "scale-110 bg-[#2f67bd]"
                    : "bg-[#b7d5f3] hover:bg-[#84b5e8]",
                ].join(" ")}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

type Carousel3DArrowProps = {
  direction: "previous" | "next";
  onClick: () => void;
  disabled: boolean;
};

function Carousel3DArrow({
  direction,
  onClick,
  disabled,
}: Carousel3DArrowProps) {
  const isPrevious = direction === "previous";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isPrevious ? "上一张" : "下一张"}
      className={[
        "absolute top-1/2 z-[110] flex -translate-y-1/2 items-center justify-center",
        "h-8 w-12 sm:h-9 sm:w-14 lg:h-10 lg:w-16",
        "rounded-full bg-[#f5a623] text-white shadow-lg",
        "transition hover:bg-[#e5921a] hover:scale-105",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-30",
        isPrevious
          ? "left-3 sm:left-4 lg:left-6"
          : "right-3 sm:right-4 lg:right-6",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-5 w-5 sm:h-6 sm:w-6"
      >
        {isPrevious ? (
          <path
            d="m15 6-6 6 6 6"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="m9 6 6 6-6 6"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
