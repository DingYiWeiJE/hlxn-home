import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";

import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
import { SolutionTracker } from "@/components/analytics/Tracker";
import {
  getPublicSolutionDetail,
  resolveSolutionLocaleSwitchUrls,
  type PublicSolutionDetail,
  type SolutionImage,
} from "@/lib/solutions/public";

type SolutionLocale = "zh" | "en";

type PageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

const labels = {
  zh: {
    back: "返回解决方案列表",
    overview: "解决方案简介",
    workingPrinciple: "工作原理",
    systemComposition: "系统构成",
    usageScenarios: "应用场景",
    customerValues: "客户价值",
    notFound: "解决方案不存在",
    brand: "汉理新能",
  },
  en: {
    back: "Back to Solutions",
    overview: "Overview",
    workingPrinciple: "Working Principle",
    systemComposition: "System Composition",
    usageScenarios: "Usage Scenarios",
    customerValues: "Customer Value",
    notFound: "Solution Not Found",
    brand: "Hanli Chuneng",
  },
} satisfies Record<SolutionLocale, Record<string, string>>;

function normalizeLocale(value: string | undefined): SolutionLocale {
  return value === "en" ? "en" : "zh";
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];
}

async function fetchSolution(params: {
  locale: string;
  slug: string;
}): Promise<PublicSolutionDetail | null> {
  const locale = normalizeLocale(params.locale);
  const slug = decodeURIComponent(params.slug).trim();

  if (!slug) {
    return null;
  }

  return getPublicSolutionDetail({
    locale,
    slug,
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = normalizeLocale(resolvedParams.locale);
  const text = labels[locale];
  const solution = await fetchSolution(resolvedParams);

  if (!solution) {
    return {
      title: `${text.notFound} | ${text.brand}`,
    };
  }

  const description =
    toStringArray(solution.summaryParagraphs)[0] ??
    (locale === "zh"
      ? `${solution.title}解决方案`
      : `${solution.title} solution`);

  const coverImage = solution.coverImage;

  return {
    title: `${solution.title} | ${text.brand}`,
    description,
    alternates: {
      canonical: `/${locale}/solutions/${solution.slug}`,
    },
    openGraph: {
      title: solution.title,
      description,
      type: "website",
      images: coverImage
        ? [
            {
              url: coverImage.url,
              alt: coverImage.alt ?? solution.title,
            },
          ]
        : undefined,
    },
  };
}

export default async function SolutionDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = normalizeLocale(resolvedParams.locale);

  setRequestLocale(locale);

  const solution = await fetchSolution(resolvedParams);

  if (!solution) {
    notFound();
  }

  const coverImage = solution.coverImage;
  const workingPrincipleBackgroundImage =
    solution.workingPrincipleBackgroundImage;

  const switchUrls = await resolveSolutionLocaleSwitchUrls({
    locale,
    slug: solution.slug,
  });

  const text = labels[locale];

  const summaryParagraphs = toStringArray(solution.summaryParagraphs);
  const highlights = toStringArray(solution.highlights);

  const workingPrincipleParagraphs = toStringArray(
    solution.workingPrincipleParagraphs,
  );

  const systemCompositionParagraphs = toStringArray(
    solution.systemCompositionParagraphs,
  );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="border-b border-slate-100 bg-white">
        <Navigation hasbg localeSwitchUrls={switchUrls} />
      </div>
      <SolutionTracker solutionId={solution.id} />

      <main className="flex-1">
        {/* 页面头图 */}
        <section className="relative overflow-hidden bg-[#F7FAFC] pt-16">
          <div className="mx-auto grid min-h-[560px] w-full max-w-[1440px] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:px-12 lg:py-20">
            <div style={{paddingLeft: "10%", paddingRight: "20%"}}>
              <Link
                href={`/${locale}/solutions`}
                className="inline-flex text-sm font-semibold text-[#2364c7] transition-colors hover:text-[#1d54a8]"
              >
                <svg className="icon" viewBox="0 0 1103 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M11.652047 412.151798a41.805655 41.805655 0 0 0 0 57.945315l415.69465 407.034345c15.9822 15.746009 41.097085 2.834282 41.097085-21.178382V596.85249s605.591525-222.176194 552.527473 409.711166c-1.417141 17.871721 19.839972 23.697744 25.429805 7.085705 79.832268-242.488546 189.188304-815.643291-586.460123-764.941141l6.534594-219.656832c0.7873-24.406315-24.721235-38.184073-41.097085-22.123144L11.652047 412.151798z" fill="currentColor"></path></svg>
              </Link>

              <h1 className="mt-5 max-w-3xl text-[3rem] font-bold leading-tight text-[#2364c7]">
                {solution.title}
              </h1>
              <h1 className="mt-5 max-w-3xl text-[3rem] font-bold leading-tight text-[#2364c7]">
                {solution.subtitle}
              </h1>

              {summaryParagraphs.length > 0 ? (
                <div className="mt-6 max-w-2xl space-y-3 text-sm leading-7 text-slate-600 sm:text-base">
                  {summaryParagraphs.map((paragraph, index) => (
                    <p key={`${paragraph}-${index}`}>{paragraph}</p>
                  ))}
                </div>
              ) : null}

              {highlights.length > 0 ? (
                <div className="mt-7 flex flex-wrap gap-3">
                  {highlights.map((highlight, index) => (
                    <span
                      key={`${highlight}-${index}`}
                      className="inline-flex min-h-10 items-center bg-[#2364c7] px-4 py-2 text-sm font-semibold text-white shadow-sm"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative min-h-[320px] overflow-hidden rounded-2xl sm:min-h-[420px]">
              {coverImage ? (
                <Image
                  src={coverImage.url}
                  alt={coverImage.alt || solution.title}
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : null}
            </div>
          </div>
        </section>

        {/* 锚点导航 */}
        <nav className="sticky top-0 z-30 border-y border-slate-100 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1100px] overflow-x-auto px-4 sm:justify-center sm:px-6">
            <AnchorLink
              href="#working-principle"
              label={text.workingPrinciple}
            />

            {systemCompositionParagraphs.length > 0 ? (
              <AnchorLink
                href="#system-composition"
                label={text.systemComposition}
              />
            ) : null}

            {solution.usageScenarios.length > 0 ? (
              <AnchorLink
                href="#usage-scenarios"
                label={text.usageScenarios}
              />
            ) : null}

            {solution.customerValues.length > 0 ? (
              <AnchorLink
                href="#customer-values"
                label={text.customerValues}
              />
            ) : null}
          </div>
        </nav>

        {/* 工作原理 */}
        <section id="working-principle" className="scroll-mt-24">
          <div className={`relative flex min-h-[500px] items-center overflow-hidden px-5 py-16 sm:px-8 lg:min-h-[620px] lg:py-24 ${
            workingPrincipleBackgroundImage ? 'bg-slate-900' : 'bg-slate-100'
          }`}>
            {workingPrincipleBackgroundImage ? (
              <Image
                src={workingPrincipleBackgroundImage.url}
                alt={
                  workingPrincipleBackgroundImage.alt || text.workingPrinciple
                }
                fill
                sizes="100vw"
                className="object-cover"
              />
            ) : null}

            {workingPrincipleBackgroundImage ? (
              <div className="absolute inset-0 bg-slate-950/60" />
            ) : null}

            <div className={`relative z-10 mx-auto w-full max-w-4xl ${
              workingPrincipleBackgroundImage ? 'text-white' : 'text-slate-900'
            }`}>
              <SectionTitle light={!!workingPrincipleBackgroundImage}>{text.workingPrinciple}</SectionTitle>

              {workingPrincipleParagraphs.length > 0 ? (
                <div className={`mx-auto mt-8 max-w-3xl space-y-4 text-center text-sm leading-8 sm:text-base ${
                  workingPrincipleBackgroundImage
                    ? 'text-white/95'
                    : 'text-slate-600'
                }`}>
                  {workingPrincipleParagraphs.map((paragraph, index) => (
                    <p key={`${paragraph}-${index}`}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* 系统构成 */}
        {systemCompositionParagraphs.length > 0 ? (
          <section
            id="system-composition"
            className="scroll-mt-24 bg-white px-5 sm:px-8"
          >
            <div className="mx-auto flex min-h-[330px] max-w-[1360px] flex-col items-center justify-center py-16 text-center lg:min-h-[377px] lg:py-20">
              <SectionTitle>{text.systemComposition}</SectionTitle>

              <div className="mt-9 max-w-[1320px] space-y-2 text-sm leading-7 text-[#475569] sm:text-base sm:leading-8 lg:mt-10">
                {systemCompositionParagraphs.map((paragraph, index) => (
                  <p key={`${paragraph}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* 应用场景 */}
        {solution.usageScenarios.length > 0 ? (
          <section
            id="usage-scenarios"
            className="scroll-mt-24 bg-[#e7f6ff] px-5 py-16 sm:px-8 lg:py-[68px]"
          >
            <div className="mx-auto max-w-[1360px]">
              <SectionTitle>{text.usageScenarios}</SectionTitle>

              <div className="mt-10 flex flex-wrap justify-center gap-3">
                {solution.usageScenarios.map((item) => (
                  <div
                    key={item.id}
                    className="flex w-full sm:w-[calc((100%_-_0.75rem)/2)] lg:w-[calc((100%_-_2.25rem)/4)]"
                  >
                    <UsageScenarioCard
                      title={item.title}
                      paragraphs={toStringArray(item.detailParagraphs)}
                      image={item.image}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* 客户价值 */}
        {solution.customerValues.length > 0 ? (
          <section
            id="customer-values"
            className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 lg:py-16"
          >
            <div className="mx-auto max-w-[1060px]">
              <SectionTitle>{text.customerValues}</SectionTitle>

              <div className="mt-6 flex flex-wrap justify-center gap-4">
                {solution.customerValues.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex w-full md:w-[calc((100%_-_1rem)/2)]"
                  >
                    <CustomerValueCard
                      title={item.title}
                      paragraphs={toStringArray(item.detailParagraphs)}
                      image={item.image}
                      accent={index % 4 === 1 || index % 4 === 2}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <Footer locale={locale} />
    </div>
  );
}

function AnchorLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-14 shrink-0 items-center justify-center whitespace-nowrap px-5 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-[#2364c7] sm:px-7"
    >
      {label}
    </a>
  );
}

function SectionTitle({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <h2
      className={
        light
          ? "text-center text-[3rem] font-bold leading-tight tracking-[0.02em] text-white"
          : "text-center text-[3rem] font-bold leading-tight tracking-[0.02em] text-[#2a62bb]"
      }
    >
      {children}
    </h2>
  );
}

function UsageScenarioCard({
  title,
  paragraphs,
  image,
}: {
  title: string;
  paragraphs: string[];
  image: SolutionImage;
}) {
  return (
    <article className="flex h-full w-full min-h-[192px] flex-col items-center justify-center rounded-[10px] bg-white px-5 py-7 text-center">
      <div className="relative h-12 w-14 shrink-0 sm:h-14 sm:w-16">
        <Image
          src={image.url}
          alt={image.alt || title}
          fill
          sizes="64px"
          className="object-contain"
        />
      </div>

      <h3 className="mt-4 text-xl font-bold leading-tight text-[#0f172a] sm:text-2xl">
        {title}
      </h3>

      {paragraphs.length > 0 ? (
        <div className="mt-2 space-y-1 text-sm leading-6 text-[#475569] sm:text-base">
          {paragraphs.map((paragraph, index) => (
            <p key={`${paragraph}-${index}`}>{paragraph}</p>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function CustomerValueCard({
  title,
  paragraphs,
  image,
  accent,
}: {
  title: string;
  paragraphs: string[];
  image: SolutionImage;
  accent: boolean;
}) {
  return (
    <article
      className={
        accent
          ? "flex h-full w-full min-h-[312px] flex-col items-center justify-center rounded-[10px] bg-[#3279c2] px-6 py-10 text-center shadow-[0_2px_14px_rgba(38,102,154,0.14)] sm:px-10"
          : "flex h-full w-full min-h-[312px] flex-col items-center justify-center rounded-[10px] border border-[#d7e9f5] bg-white px-6 py-10 text-center shadow-[0_2px_14px_rgba(38,102,154,0.14)] sm:px-10"
      }
    >
      <div className="relative h-[68px] w-[76px] shrink-0">
        <Image
          src={image.url}
          alt={image.alt || title}
          fill
          sizes="76px"
          className="object-contain"
        />
      </div>

      <h3
        className={
          accent
            ? "mt-6 text-xl font-bold leading-tight text-white sm:text-2xl"
            : "mt-6 text-xl font-bold leading-tight text-[#0f172a] sm:text-2xl"
        }
      >
        {title}
      </h3>

      {paragraphs.length > 0 ? (
        <div
          className={
            accent
              ? "mt-4 max-w-[390px] space-y-1 text-sm leading-6 text-white sm:text-base"
              : "mt-4 max-w-[390px] space-y-1 text-sm leading-6 text-[#64748b] sm:text-base"
          }
        >
          {paragraphs.map((paragraph, index) => (
            <p key={`${paragraph}-${index}`}>{paragraph}</p>
          ))}
        </div>
      ) : null}
    </article>
  );
}