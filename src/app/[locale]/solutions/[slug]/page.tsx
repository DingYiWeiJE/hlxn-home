import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";

import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
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
    usageScenarios: "使用场景",
    customerValues: "客户价值",
    notFound: "解决方案不存在",
    brand: "汉理楚能",
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
      ? `${solution.name}解决方案`
      : `${solution.name} solution`);

  const backgroundImage = solution.workingPrincipleBackgroundImage;

  return {
    title: `${solution.name} | ${text.brand}`,
    description,
    alternates: {
      canonical: `/${locale}/solutions/${solution.slug}`,
    },
    openGraph: {
      title: solution.name,
      description,
      type: "website",
      images: backgroundImage
        ? [
            {
              url: backgroundImage.url,
              alt: backgroundImage.alt ?? solution.name,
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

  const backgroundImage = solution.workingPrincipleBackgroundImage;

  if (!backgroundImage) {
    notFound();
  }

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

      <main className="flex-1">
        <section className="relative overflow-hidden bg-[#f4f9fc] pt-16">
          <div className="mx-auto grid min-h-[560px] w-full max-w-[1440px] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:px-12 lg:py-20">
            <div>
              <Link
                href={`/${locale}/solutions`}
                className="inline-flex text-sm font-semibold text-[#2364c7] transition hover:text-[#1d54a8]"
              >
                {text.back}
              </Link>
              <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight text-[#2364c7] sm:text-4xl lg:text-5xl">
                {solution.name}
              </h1>
              {summaryParagraphs.length > 0 ? (
                <div className="mt-6 max-w-2xl space-y-3 text-sm leading-7 text-slate-600 sm:text-base">
                  {summaryParagraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
              {highlights.length > 0 ? (
                <div className="mt-7 flex flex-wrap gap-3">
                  {highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="inline-flex min-h-10 items-center rounded-md bg-[#2364c7] px-4 py-2 text-sm font-semibold text-white shadow-sm"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="relative min-h-[320px] overflow-hidden rounded-2xl bg-[#dceef8] sm:min-h-[420px]">
              <Image
                src={backgroundImage.url}
                alt={
                  backgroundImage.alt || solution.name
                }
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <nav className="sticky top-0 z-30 border-y border-slate-100 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1100px] overflow-x-auto px-4 sm:justify-center sm:px-6">
            <AnchorLink href="#overview" label={text.overview} />
            <AnchorLink href="#working-principle" label={text.workingPrinciple} />
            {systemCompositionParagraphs.length > 0 ? (
              <AnchorLink
                href="#system-composition"
                label={text.systemComposition}
              />
            ) : null}
            {solution.usageScenarios.length > 0 ? (
              <AnchorLink href="#usage-scenarios" label={text.usageScenarios} />
            ) : null}
            {solution.customerValues.length > 0 ? (
              <AnchorLink href="#customer-values" label={text.customerValues} />
            ) : null}
          </div>
        </nav>

        <section id="overview" className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-4xl">
            <SectionTitle>{text.overview}</SectionTitle>
            <div className="mt-8 space-y-4 text-base leading-8 text-slate-600">
              {summaryParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>

        <section id="working-principle" className="scroll-mt-24">
          <div className="relative flex min-h-[500px] items-center overflow-hidden bg-slate-900 px-5 py-16 sm:px-8 lg:min-h-[620px] lg:py-24">
            <Image
              src={backgroundImage.url}
              alt={
                backgroundImage.alt ||
                text.workingPrinciple
              }
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/60" />
            <div className="relative z-10 mx-auto w-full max-w-4xl text-white">
              <SectionTitle light>{text.workingPrinciple}</SectionTitle>
              <div className="mx-auto mt-8 max-w-3xl space-y-4 text-center text-sm leading-8 text-white/95 sm:text-base">
                {workingPrincipleParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {systemCompositionParagraphs.length > 0 ? (
          <section
            id="system-composition"
            className="scroll-mt-24 bg-[#eef8ff] px-5 py-16 sm:px-8 lg:py-24"
          >
            <div className="mx-auto max-w-5xl">
              <SectionTitle>{text.systemComposition}</SectionTitle>
              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {systemCompositionParagraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="rounded-2xl border border-white/80 bg-white p-6 text-sm leading-7 text-slate-600 shadow-sm"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {solution.usageScenarios.length > 0 ? (
          <section
            id="usage-scenarios"
            className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 lg:py-24"
          >
            <div className="mx-auto max-w-[1100px]">
              <SectionTitle>{text.usageScenarios}</SectionTitle>
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {solution.usageScenarios.map((item) => (
                  <ImageTitleCard
                    key={item.id}
                    title={item.title}
                    paragraphs={toStringArray(item.detailParagraphs)}
                    image={item.image}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {solution.customerValues.length > 0 ? (
          <section
            id="customer-values"
            className="scroll-mt-24 bg-[#eef8ff] px-5 py-16 sm:px-8 lg:py-24"
          >
            <div className="mx-auto max-w-[1120px]">
              <SectionTitle>{text.customerValues}</SectionTitle>
              <div className="mt-12 space-y-8">
                {solution.customerValues.map((item, index) => (
                  <article
                    key={item.id}
                    className="grid overflow-hidden rounded-2xl bg-white shadow-sm lg:grid-cols-2"
                  >
                    <div
                      className={
                        index % 2 === 1
                          ? "relative min-h-[260px] lg:order-2"
                          : "relative min-h-[260px]"
                      }
                    >
                      <Image
                        src={item.image.url}
                        alt={item.image.alt || item.title}
                        fill
                        sizes="(max-width: 1023px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                      <h3 className="text-2xl font-bold text-[#102a43]">
                        {item.title}
                      </h3>
                      <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600 sm:text-base">
                        {toStringArray(item.detailParagraphs).map(
                          (paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                          ),
                        )}
                      </div>
                    </div>
                  </article>
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
      className="inline-flex min-h-14 shrink-0 items-center justify-center whitespace-nowrap px-5 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-[#2364c7] sm:px-7"
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
          ? "text-center text-3xl font-bold tracking-wide text-white sm:text-4xl"
          : "text-center text-3xl font-bold tracking-wide text-[#2364c7] sm:text-4xl"
      }
    >
      {children}
    </h2>
  );
}

function ImageTitleCard({
  title,
  paragraphs,
  image,
}: {
  title: string;
  paragraphs: string[];
  image: SolutionImage;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#dceef8]">
        <Image
          src={image.url}
          alt={image.alt || title}
          fill
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-[#102a43]">{title}</h3>
        {paragraphs.length > 0 ? (
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
