import Image from "next/image";
import Navigation from "@/components/Navigation";
import {
  getCmsBackground,
  type CmsBackgroundLocationKey,
} from "@/lib/cms/backgrounds";

type Props = {
  location: CmsBackgroundLocationKey;
  fallbackImage: string;
  title: string;
  subtitle?: string;
  heightClassName?: string;
  overlayClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export default async function PageHero({
  location,
  fallbackImage,
  title,
  subtitle,
  heightClassName = "h-[60vh]",
  overlayClassName = "bg-[#001524]/60",
  titleClassName = "text-[3rem] font-bold text-white mb-4",
  subtitleClassName = "mt-4 max-w-2xl text-lg text-white md:text-xl",
}: Props) {
  const background = await getCmsBackground(location);
  const isVideo = background?.type === "video";

  return (
    <div className={`relative ${heightClassName} flex flex-col overflow-hidden`}>
      {isVideo ? (
        <video
          src={background.url}
          poster={fallbackImage}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <Image
          src={background?.url ?? fallbackImage}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}

      <div className={`absolute inset-0 ${overlayClassName}`} />

      <div className="relative z-10 flex h-full flex-col">
        <Navigation />
        <div className="flex flex-1 flex-col items-start justify-center">
          <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8">
            <h1 className={titleClassName}>{title}</h1>
            {subtitle ? <p className={subtitleClassName}>{subtitle}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
