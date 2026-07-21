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
};

export default function ImageCarousel({
  images,
  className = "",
  imagePriorityCount = 1,
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
    />
  );
}