import type { ReactNode } from "react";

export type IntroCardProps = {
  title: ReactNode;
  description: ReactNode;
  buttonText?: string;
  buttonHref?: string;
  className?: string;
};

export default function IntroCard({
  title,
  description,
  buttonText = "了解更多",
  buttonHref = "#",
  className = "",
}: IntroCardProps) {
  return (
    <section
      className={[
        "w-full px-4 py-8",
        "sm:px-6 sm:py-10",
        "lg:px-12 lg:py-10",
        "flex flex-col items-center lg:items-start",
        className,
      ].join(" ")}
    >
      <div className="mx-auto lg:max-w-[430px] w-full">
        <h2 className="whitespace-pre-line text-[30px] font-bold leading-[1.35] tracking-wide text-[#2864bd] sm:text-[34px] text-center lg:text-left">
          {title}
        </h2>

        <div className="mt-8 text-[15px] leading-[1.95] text-slate-600 sm:mt-9 sm:text-base text-center lg:text-left">
          {description}
        </div>

        <div className="flex justify-center lg:justify-start">
          <a
            href={buttonHref}
            className="
              group mt-10 inline-flex min-h-12 items-center justify-center
              gap-2 rounded-full bg-[#2f67bd] px-8
              text-base font-medium text-white
              transition duration-300
              hover:-translate-y-0.5 hover:bg-[#2459a8] hover:shadow-lg
              focus-visible:outline-none
              focus-visible:ring-4 focus-visible:ring-blue-200
              active:translate-y-0
              sm:mt-11 sm:min-h-14
            "
          >
          <span>{buttonText}</span>

          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
          >
            <path
              d="M5 12h13M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          </a>
        </div>
      </div>
    </section>
  );
}