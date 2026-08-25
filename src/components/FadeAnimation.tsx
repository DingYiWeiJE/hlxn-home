'use client';

import {
  CSSProperties,
  ElementType,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

type AnimationType =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in'
  | 'zoom-out';

type FadeAnimationProps = {
  children: ReactNode;

  // 最终渲染的标签
  as?: ElementType;

  // 动画类型
  animation?: AnimationType;

  // 动画参数
  distance?: number;
  duration?: number;
  delay?: number;
  threshold?: number;

  // 是否只播放一次
  once?: boolean;

  className?: string;
};

export default function FadeAnimation({
  children,
  as: Component = 'div',
  animation = 'fade-up',
  distance = 60,
  duration = 800,
  delay = 0,
  threshold = 0.15,
  once = true,
  className = '',
}: FadeAnimationProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);

          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setVisible(false);
        }
      },
      {
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [once, threshold]);

  const style = {
    '--animation-distance': `${distance}px`,
    '--animation-duration': `${duration}ms`,
    '--animation-delay': `${delay}ms`,
  } as CSSProperties;

  return (
    <Component
      ref={ref}
      className={[
        'scroll-animation',
        `scroll-animation-${animation}`,
        visible ? 'scroll-animation-visible' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {children}
    </Component>
  );
}