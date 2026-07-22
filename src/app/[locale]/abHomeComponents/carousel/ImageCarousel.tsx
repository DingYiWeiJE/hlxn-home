// components/carousel/ImageCarousel.tsx

import ImageCarouselClient from "./ImageCarouselClient";

export type CarouselImage = {
  src: string;
  alt?: string;
};

export type ImageCarouselProps = {
  images: Array<string | CarouselImage>;
  className?: string;
  imagePriorityCount?: number;

  /**
   * cover：铺满容器，可能裁剪，适合设备、环境图片
   * contain：完整展示，可能留白，适合证书、文件图片
   */
  imageFit?: "cover" | "contain";

  /**
   * 自定义图片容器比例。
   * 例如证书可以传 "210 / 297"。
   *
   * 不传时继续使用原来的响应式比例：
   * 移动端 4 / 3，桌面端 1.43 / 1。
   */
  imageAspectRatio?: string;

  /**
   * 桌面端一屏展示数量。
   */
  desktopVisibleCount?: number;

  /**
   * 是否开启自动轮播，默认 true
   */
  autoplay?: boolean;

  /**
   * 自动轮播间隔（毫秒），默认 5000
   */
  autoplayInterval?: number;
};

export default function ImageCarousel({
  images,
  className = "",
  imagePriorityCount = 1,
  imageFit = "cover",
  imageAspectRatio,
  desktopVisibleCount = 3,
  autoplay = true,
  autoplayInterval = 2000,
}: ImageCarouselProps) {
  const normalizedImages: CarouselImage[] = images.map((image, index) => {
    if (typeof image === "string") {
      return {
        src: image,
        alt: `轮播图片 ${index + 1}`,
      };
    }

    return {
      src: image.src,
      alt: image.alt ?? `轮播图片 ${index + 1}`,
    };
  });

  if (normalizedImages.length === 0) {
    return null;
  }

  return (
    <ImageCarouselClient
      images={normalizedImages}
      className={className}
      imagePriorityCount={imagePriorityCount}
      imageFit={imageFit}
      imageAspectRatio={imageAspectRatio}
      desktopVisibleCount={desktopVisibleCount}
      autoplay={autoplay}
      autoplayInterval={autoplayInterval}
    />
  );
}
