import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
import type { Metadata } from "next";
import AnimatedCounter from "@/components/AnimatedCounter";
import ImageCarousel from "../abHomeComponents/carousel/ImageCarousel";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "zh" ? "关于我们 | 汉理新能" : "About Us | Hanli Energy",
    description:
      locale === "zh"
        ? "了解汉理新能的公司信息、愿景使命和创新成果"
        : "Learn about Hanli Energy's company information, vision, mission and innovative achievements",
  };
}

function VisionIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-12 w-12"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="21" stroke="currentColor" strokeWidth="4" />
      <path
        d="M40.5 22.5 35 35l-12.5 5.5L28 28l12.5-5.5Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="3" fill="currentColor" />
    </svg>
  );
}

function MissionIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-12 w-12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 53V12"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M20 16c9-6 16 5 26-1v23c-10 6-17-5-26 1V16Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ValuesIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-12 w-12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m32 52 20-25-7-13H19l-7 13 20 25Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M12 27h40M19 14l13 38 13-38M19 14l13 13 13-13"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AboutContent({ locale }: { locale: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      <HeaderSection locale={locale} />
      <main>
        <CompanyIntroSection locale={locale} />
        <VisionMissionSection locale={locale} />
        <PatentSection locale={locale} />
        <MapSection locale={locale} />
      </main>
      <Footer locale={locale} />
    </div>
  );
}

async function HeaderSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });

  return (
    <div
      className="relative h-[60vh] bg-cover bg-center flex flex-col"
      style={{
        backgroundImage: "url('/images/about/about-background.jpeg')",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-[#001524C9] opacity-50"></div>
      <div className="relative flex flex-col h-full">
        <Navigation />
        <div className="flex-1 flex flex-col items-start justify-center">
          <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {t("aboutPage.header")}
            </h1>
            <p className="text-lg md:text-xl text-white max-w-2xl">
              {t("aboutPage.headerSubtitle")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

async function CompanyIntroSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });
  const intros = t.raw("aboutPage.companyIntro") as string[];

  return (
    <section className="bg-[#eaf7ff] py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8">
        <h1 className="mb-6 md:mb-8 text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide text-[#2365c4]">
          {t("aboutPage.companyIntroTitle")}
        </h1>

        <div className="space-y-4 md:space-y-6 text-sm md:text-base leading-[1.8] text-[#1f3448] lg:max-w-[500px]">
          {intros.map((intro, index) => (
            <p key={index}>{intro}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

async function VisionMissionSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-8">
        <h2 className="text-center text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide text-[#2365c4]">
          {t("aboutPage.visionTitle")}
        </h2>

        <div className="mt-12 md:mt-16 grid gap-10 md:gap-14 md:grid-cols-3">
          <article className="flex flex-col items-center text-center">
            <div className="text-[#2365c4]">
              <VisionIcon />
            </div>
            <h3 className="mt-4 md:mt-5 text-xl md:text-2xl font-bold text-[#07101f]">
              {t("aboutPage.visionTitle")}
            </h3>
            <p className="mt-3 md:mt-4 text-sm md:text-base font-medium leading-6 md:leading-7 text-[#27384b]">
              {t("aboutPage.vision")}
            </p>
          </article>

          <article className="flex flex-col items-center text-center">
            <div className="text-[#2365c4]">
              <MissionIcon />
            </div>
            <h3 className="mt-4 md:mt-5 text-xl md:text-2xl font-bold text-[#07101f]">
              {t("aboutPage.mission")}
            </h3>
            <p className="mt-3 md:mt-4 max-w-[180px] md:max-w-[220px] text-sm md:text-base font-medium leading-6 md:leading-7 text-[#27384b]">
              {t("aboutPage.mission")}
            </p>
          </article>

          <article className="flex flex-col items-center text-center">
            <div className="text-[#2365c4]">
              <ValuesIcon />
            </div>
            <h3 className="mt-4 md:mt-5 text-xl md:text-2xl font-bold text-[#07101f]">
              {t("aboutPage.values")}
            </h3>
            <p className="mt-3 md:mt-4 max-w-[200px] md:max-w-[240px] text-sm md:text-base font-medium leading-6 md:leading-7 text-[#27384b]">
              {t("aboutPage.values")}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

async function PatentSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });
  const patents = t.raw("aboutPage.patentItems") as Array<{
    number: number;
    label: string;
  }>;

  return (
    <section className="bg-[#eaf7ff] py-8 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-4 lg:pl-[7%] lg:pr-[5%]">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr_1fr_1fr] md:items-center">
          <div>
            <p className="text-base md:text-lg font-semibold text-[#2365c4]">
              {t("aboutPage.patentPeriod")}
            </p>
            <h2 className="mt-4 text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide text-[#2365c4]">
              {t("aboutPage.patentTitle")}
            </h2>
          </div>

          {patents.map((item, index) => (
            <div key={index} className="text-center">
              <AnimatedCounter
                value={parseInt(item.number as any)}
                duration={1600 + index * 200}
                delay={index * 120}
                className="block text-4xl md:text-6xl lg:text-7xl font-bold tabular-nums leading-none text-[#2365c4]"
              />
              <p className="mt-3 md:mt-5 text-base md:text-lg font-medium text-[#27384b]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8 mt-12">
        <h2 className="text-center text-[#2A62BB] text-xl md:text-2xl lg:text-2.3rem mt-12 md:mt-5rem font-bold">
          {t("aboutPage.honorTitle")}
        </h2>
        <ImageCarousel
          images={[
            "/images/about/patent-1.jpeg",
            "/images/about/patent-2.jpeg",
            "/images/about/patent-3.jpeg",
            "/images/about/patent-4.jpeg",
          ]}
          imageFit="contain"
          imageAspectRatio="210 / 297"
          desktopVisibleCount={4}
          imagePriorityCount={4}
        />
      </div>
    </section>
  );
}

async function MapSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });

  return (
    <>
      <section className="bg-white py-16">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8">
          <div className="flex justify-center">
            <img
              src="/images/about/map.png"
              alt="Company Map"
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#e7f6ff] py-16 lg:py-24">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#2365c4] mb-6">
              {t("aboutPage.mapTitle")}
            </h2>
            <p className="text-base md:text-lg text-[#1f3448] max-w-2xl mx-auto">
              {t("aboutPage.mapDescription")}
            </p>
            <ImageCarousel
              images={[
                "/images/about/showcase-1.jpeg",
                "/images/about/showcase-2.jpeg",
                "/images/about/showcase-3.jpeg",
                "/images/about/showcase-4.jpeg",
              ]}
              desktopVisibleCount={3}
              imagePriorityCount={4}
            />
          </div>
        </div>
      </section>
    </>
  );
}

export default async function About({ params }: Props) {
  const { locale } = await params;

  setRequestLocale(locale);

  return <AboutContent locale={locale} />;
}
