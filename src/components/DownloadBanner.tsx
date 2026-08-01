import Image from "next/image";

export function DownloadBanner({
  image,
  title,
  buttonText,
  priority = false,
}: {
  image: string;
  title: string;
  buttonText: string;
  priority?: boolean;
}) {
  return (
    <section className="relative isolate flex h-[350px] items-center justify-center overflow-hidden">
      <Image
        src={image}
        alt=""
        fill
        sizes="100vw"
        priority={priority}
        quality={85}
        className="-z-20 object-cover"
      />

      <div className="absolute inset-0 -z-10 bg-[#1A589B]/65" />

      <div className="flex flex-col items-center justify-center gap-4 px-5 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          {title}
        </h2>

        <a
          href="#"
          className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-3 text-base font-medium text-slate-600 shadow-sm transition-shadow duration-200 hover:shadow-md"
        >
          <span>{buttonText}</span>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </a>
      </div>
    </section>
  );
}