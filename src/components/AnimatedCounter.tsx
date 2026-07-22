"use client";

import { useEffect, useRef, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
};

export default function AnimatedCounter({
  value,
  duration = 1600,
  delay = 0,
  className,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const counterRef = useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const element = counterRef.current;

    if (!element) return;

    // 尊重用户系统中的“减少动态效果”设置
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    let animationFrameId: number;
    let delayTimer: ReturnType<typeof setTimeout>;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimatedRef.current) return;

        hasAnimatedRef.current = true;
        observer.disconnect();

        delayTimer = setTimeout(() => {
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // easeOutCubic：前期增长较快，结尾平滑减速
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(value * easedProgress);

            setDisplayValue(currentValue);

            if (progress < 1) {
              animationFrameId = requestAnimationFrame(animate);
            } else {
              setDisplayValue(value);
            }
          };

          animationFrameId = requestAnimationFrame(animate);
        }, delay);
      },
      {
        // 统计区域约有 25% 进入视口时启动
        threshold: 0.25,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      clearTimeout(delayTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration, delay]);

  return (
    <span ref={counterRef} className={className}>
      {displayValue}
    </span>
  );
}