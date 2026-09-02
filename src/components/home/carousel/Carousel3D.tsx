// components/carousel/Carousel3D.tsx
// 3D 立体轮播（coverflow 效果），与 ImageCarousel 独立，不修改原组件。

import Carousel3DClient from "./Carousel3DClient";
import type { CarouselImage } from "./ImageCarousel";

export type Carousel3DProps = {
  images: Array<string | CarouselImage>;
  className?: string;
  imagePriorityCount?: number;

  /**
   * cover：铺满容器，可能裁剪，适合设备、环境图片
   * contain：完整展示，可能留白，适合证书、文件图片
   */
  imageFit?: "cover" | "contain";

  /**
   * 图片容器比例，默认 16 / 10。
   */
  imageAspectRatio?: string;

  /**
   * 是否开启自动轮播，默认 true
   */
  autoplay?: boolean;

  /**
   * 自动轮播间隔（毫秒），默认 3500
   */
  autoplayInterval?: number;
};

export default function Carousel3D({
  images,
  className = "",
  imagePriorityCount = 1,
  imageFit = "cover",
  imageAspectRatio = "16 / 10",
  autoplay = true,
  autoplayInterval = 3500,
}: Carousel3DProps) {
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
    <Carousel3DClient
      images={normalizedImages}
      className={className}
      imagePriorityCount={imagePriorityCount}
      imageFit={imageFit}
      imageAspectRatio={imageAspectRatio}
      autoplay={autoplay}
      autoplayInterval={autoplayInterval}
    />
  );
}
