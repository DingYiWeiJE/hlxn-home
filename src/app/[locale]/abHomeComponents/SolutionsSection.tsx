import Link from "next/link";
import { getTranslations } from "next-intl/server";

type Props = {
  locale: string;
};

type SolutionItem = {
  title: string;
  description: string;
};

const SolutionsSection: React.FC<Props> = async ({ locale }) => {
  const t = await getTranslations({ locale });
  const solutionItems = t.raw("solutionsSection.solutions") as SolutionItem[];
  return (
    <section
      className="relative isolate overflow-hidden bg-slate-900 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/home/home-bg-2.png')",
        backgroundAttachment: "fixed",
      }}
    >
      {/* 深色遮罩 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-slate-950/60"
      />

      {/* 辅助渐变，增强左侧文字可读性 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/65 via-slate-900/30 to-slate-950/10"
      />

      <div className="mx-auto grid min-h-[900px] max-w-[1440px] grid-cols-1 gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[1000px] lg:grid-cols-[minmax(0,520px)_1fr] lg:gap-16 lg:px-12 lg:py-20 xl:px-20">
        {/* 左侧方案列表 */}
        <div className="self-start">
          <header>
            <h2 className="text-3xl font-bold tracking-wide text-white sm:text-4xl lg:text-[40px]">
              {t("solutionsSection.title")}
            </h2>

            <p className="mt-7 text-lg font-semibold leading-8 text-white/95 sm:text-xl lg:mt-8 lg:text-[23px]">
              {t("solutionsSection.subtitle")}
            </p>
          </header>

          <div className="mt-8 border-t border-white/40 lg:mt-10">
            {solutionItems.map((item) => (
              <article
                key={item.title}
                className="border-b border-white/40 py-7 sm:py-8 lg:py-9"
              >
                <h3 className="text-xl font-bold text-white sm:text-2xl lg:text-[25px]">
                  {item.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base sm:leading-8 lg:text-[16px]">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* 右侧宣传语 */}
        <div className="flex items-center justify-center lg:justify-end">
          <div className="w-full text-center lg:max-w-[650px] lg:text-left">
            <p className="text-3xl font-bold leading-tight text-white drop-shadow-sm sm:text-4xl lg:text-[40px] xl:text-[43px]">
              {t("solutionsSection.tagline")}
            </p>

            <Link
              href="/about"
              className="group mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2f67bd] px-8 text-base font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#2459a8] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50 sm:min-h-14 sm:px-9 sm:text-lg"
            >
              <span>{t("solutionsSection.learnMore")}</span>

              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
              >
                <path
                  d="M5 12h13M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;