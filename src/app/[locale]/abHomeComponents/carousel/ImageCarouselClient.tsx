// components/carousel/ImageCarouselClient.tsx

"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
} from "react";

import type { CarouselImage } from "./ImageCarousel";

type ImageCarouselClientProps = {
  images: CarouselImage[];
  className?: string;
  imagePriorityCount?: number;
};

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";
const DESKTOP_VISIBLE_COUNT = 3;
const DESKTOP_GAP = 16;
const SWIPE_THRESHOLD = 50;
const TRANSITION_DURATION = 500;

export default function ImageCarouselClient({
  images,
  className = "",
  imagePriorityCount = 1,
}: ImageCarouselClientProps) {
  const [visibleCount, setVisibleCount] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  const imageCount = images.length;
  const canSlide = imageCount > 1;

  /*
   * 图片数量不足 3 张时，桌面端只展示实际图片数量。
   * 例如只有 2 张图片，桌面端展示 2 张。
   */
  const effectiveVisibleCount = Math.min(visibleCount, imageCount);

  /*
   * 为了实现无缝循环：
   *
   * [尾部克隆] [原始图片] [头部克隆]
   */
  const renderedImages = useMemo(() => {
    if (!canSlide) {
      return images;
    }

    const headClones = images.slice(0, effectiveVisibleCount);
    const tailClones = images.slice(-effectiveVisibleCount);

    return [...tailClones, ...images, ...headClones];
  }, [canSlide, effectiveVisibleCount, images]);

  /*
   * 根据断点切换一屏展示数量。
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

    const updateVisibleCount = () => {
      const nextVisibleCount = mediaQuery.matches
        ? DESKTOP_VISIBLE_COUNT
        : 1;

      setVisibleCount(nextVisibleCount);
    };

    updateVisibleCount();
    mediaQuery.addEventListener("change", updateVisibleCount);

    return () => {
      mediaQuery.removeEventListener("change", updateVisibleCount);
    };
  }, []);

  /*
   * 可视数量变化时，将索引重置到原始图片区域的第一张。
   * 禁用动画，避免响应式切换时产生滑动。
   */
  useEffect(() => {
    setTransitionEnabled(false);
    setIsAnimating(false);
    setCurrentIndex(canSlide ? effectiveVisibleCount : 0);
  }, [canSlide, effectiveVisibleCount]);

  const goToPrevious = useCallback(() => {
    if (!canSlide || isAnimating) {
      return;
    }

    setTransitionEnabled(true);
    setIsAnimating(true);
    setCurrentIndex((previousIndex) => previousIndex - 1);
  }, [canSlide, isAnimating]);

  const goToNext = useCallback(() => {
    if (!canSlide || isAnimating) {
      return;
    }

    setTransitionEnabled(true);
    setIsAnimating(true);
    setCurrentIndex((previousIndex) => previousIndex + 1);
  }, [canSlide, isAnimating]);

  const goToImage = useCallback(
    (imageIndex: number) => {
      if (!canSlide || isAnimating) {
        return;
      }

      setTransitionEnabled(true);
      setIsAnimating(true);

      // 跳转到原始图片区域中的指定图片。
      setCurrentIndex(effectiveVisibleCount + imageIndex);
    },
    [canSlide, effectiveVisibleCount, isAnimating],
  );

  /*
   * 动画完成后判断是否进入了克隆区域。
   *
   * 进入尾部克隆区域：
   * 无动画跳回第一张原始图片。
   *
   * 进入头部克隆区域：
   * 无动画跳回最后一张原始图片。
   */
  const handleTransitionEnd = () => {
    if (!canSlide) {
      return;
    }

    const firstOriginalIndex = effectiveVisibleCount;
    const firstTailCloneIndex =
      effectiveVisibleCount + imageCount;

    if (currentIndex >= firstTailCloneIndex) {
      setTransitionEnabled(false);
      setCurrentIndex(firstOriginalIndex);
    } else if (currentIndex < firstOriginalIndex) {
      setTransitionEnabled(false);
      setCurrentIndex(imageCount + effectiveVisibleCount - 1);
    }

    setIsAnimating(false);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchCurrentX.current = touchStartX.current;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    touchCurrentX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = () => {
    if (
      touchStartX.current === null ||
      touchCurrentX.current === null
    ) {
      return;
    }

    const distance =
      touchStartX.current - touchCurrentX.current;

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

  /*
   * 当前圆点对应当前窗口最左侧的原始图片。
   * 克隆区域也会归一化为真实图片索引。
   */
  const activeImageIndex = canSlide
    ? normalizeIndex(
        currentIndex - effectiveVisibleCount,
        imageCount,
      )
    : 0;

  /*
   * 每一步的距离：
   *
   * 移动端：
   * 100%
   *
   * 桌面端展示 3 张且间距为 16px：
   * 单张宽度 + 间距
   * = (100% - 32px) / 3 + 16px
   * = 100% / 3 + 16px / 3
   */
  const gap =
    effectiveVisibleCount > 1 ? DESKTOP_GAP : 0;

  const translatePercent =
    (currentIndex * 100) / effectiveVisibleCount;

  const translateGap =
    (currentIndex * gap) / effectiveVisibleCount;

  const trackTransform = `translate3d(calc(-${translatePercent}% - ${translateGap}px), 0, 0)`;

  if (imageCount === 0) {
    return null;
  }

  return (
    <section
      className={[
        "w-full overflow-hidden bg-[#e8f6ff]",
        "px-3 py-6 sm:px-6 sm:py-8",
        "lg:px-5 lg:py-7",
        className,
      ].join(" ")}
      aria-label="图片轮播"
      aria-roledescription="carousel"
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 sm:gap-5">
        <CarouselArrow
          direction="previous"
          onClick={goToPrevious}
          disabled={!canSlide}
        />

        <div
          className="min-w-0 flex-1 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex w-full"
            onTransitionEnd={handleTransitionEnd}
            style={{
              gap: `${gap}px`,
              transform: trackTransform,
              transitionProperty: transitionEnabled
                ? "transform"
                : "none",
              transitionDuration: transitionEnabled
                ? `${TRANSITION_DURATION}ms`
                : "0ms",
              transitionTimingFunction: "ease-out",
              willChange: "transform",
            }}
          >
            {renderedImages.map((image, renderedIndex) => {
              const originalIndex = getOriginalImageIndex({
                renderedIndex,
                imageCount,
                cloneCount: canSlide
                  ? effectiveVisibleCount
                  : 0,
              });

              return (
                <div
                  key={`${image.src}-${renderedIndex}`}
                  className={[
                    "relative shrink-0 overflow-hidden bg-slate-100",
                    "aspect-[4/3]",
                    "lg:aspect-[1.43/1]",
                  ].join(" ")}
                  style={{
                    width:
                      effectiveVisibleCount === 1
                        ? "100%"
                        : `calc((100% - ${
                            gap *
                            (effectiveVisibleCount - 1)
                          }px) / ${effectiveVisibleCount})`,
                  }}
                  aria-hidden={
                    originalIndex !== activeImageIndex
                  }
                >
                  <Image
                    src={image.src}
                    alt={image.alt ?? ""}
                    fill
                    priority={
                      originalIndex < imagePriorityCount
                    }
                    sizes={
                      effectiveVisibleCount === 1
                        ? "90vw"
                        : "(min-width: 1024px) 31vw, 90vw"
                    }
                    className="object-cover"
                    draggable={false}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <CarouselArrow
          direction="next"
          onClick={goToNext}
          disabled={!canSlide}
        />
      </div>

      {canSlide && (
        <div
          className="mt-5 flex items-center justify-center gap-3 lg:mt-6"
          role="tablist"
          aria-label="选择轮播图片"
        >
          {images.map((image, imageIndex) => {
            const isActive =
              imageIndex === activeImageIndex;

            return (
              <button
                key={`${image.src}-indicator-${imageIndex}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`切换到第 ${imageIndex + 1} 张图片`}
                onClick={() => goToImage(imageIndex)}
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

type CarouselArrowProps = {
  direction: "previous" | "next";
  onClick: () => void;
  disabled: boolean;
};

function CarouselArrow({
  direction,
  onClick,
  disabled,
}: CarouselArrowProps) {
  const isPrevious = direction === "previous";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isPrevious ? "上一张" : "下一张"}
      className={[
        "flex h-11 w-9 shrink-0 items-center justify-center",
        "text-[#2f67bd] transition",
        "hover:scale-110 hover:text-[#1e55a8]",
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-blue-500",
        "focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-30",
        "sm:h-12 sm:w-10",
        "lg:h-14 lg:w-11",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-8 w-8 sm:h-9 sm:w-9"
      >
        {isPrevious ? (
          <>
            <path
              d="M11 6 5 12l6 6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="m18 6-6 6 6 6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <>
            <path
              d="m6 6 6 6-6 6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="m13 6 6 6-6 6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>
    </button>
  );
}

function normalizeIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

type GetOriginalImageIndexOptions = {
  renderedIndex: number;
  imageCount: number;
  cloneCount: number;
};

function getOriginalImageIndex({
  renderedIndex,
  imageCount,
  cloneCount,
}: GetOriginalImageIndexOptions) {
  if (imageCount <= 1) {
    return 0;
  }

  return normalizeIndex(
    renderedIndex - cloneCount,
    imageCount,
  );
}