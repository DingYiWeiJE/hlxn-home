import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import Navigation from "@/components/Navigation";
import SiteFooter from "@/components/SiteFooter";
import { CaseTracker } from "@/components/analytics/Tracker";

type ApplicationCase = {
  id: string;
  title: string;
  slug: string;
  locale: string;
  caseDate: string;
  contentParagraphs: string[];
  imageAsset: {
    id: string;
    url: string;
    width: number | null;
    height: number | null;
    alt: string | null;
  } | null;
  createdAt: string;
};

type Props = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export default async function ApplicationCaseDetail({
  params,
}: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  let caseData: ApplicationCase | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/application-cases/${slug}?locale=${locale}`,
      { next: { revalidate: 3600 } },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch case");
    }

    const data = await response.json();

    if (data.success) {
      caseData = data.data;
    } else {
      error =
        data.error?.message ||
        "Failed to load case";
    }
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Failed to load case";
  }

  if (error || !caseData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation hasbg/>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {error || "应用案例不存在"}
            </p>

            <Link
              href={`/${locale}/cases`}
              className="inline-flex items-center gap-2 text-[#2463c5] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === "zh"
                ? "返回应用案例"
                : "Back to Cases"}
            </Link>
          </div>
        </div>

        <SiteFooter locale={locale} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation hasbg/>
      <CaseTracker caseId={caseData.id} />

      <main className="flex-1">
        <div className="mx-auto max-w-[1280px] px-5 md:px-8 py-12">
          <div className="w-full h-[3rem]"/>
          <article>
            {caseData.imageAsset && (
              <div className="relative aspect-video overflow-hidden rounded-lg mb-8">
                <Image
                  src={caseData.imageAsset.url}
                  alt={
                    caseData.imageAsset.alt ||
                    caseData.title
                  }
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <header className="mb-8">
              <h1 className="text-[3rem] font-bold text-[#102a43] mb-4">
                {caseData.title}
              </h1>

              <div className="flex items-center gap-4 text-[#334e68]">
                <time>
                  {new Date(
                    caseData.caseDate,
                  ).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
            </header>

            <div className="prose prose-lg max-w-none">
              {caseData.contentParagraphs &&
                caseData.contentParagraphs.map(
                  (
                    paragraph,
                    index,
                  ) => (
                    <p
                      key={index}
                      className="mb-6 text-[#334e68] leading-8"
                    >
                      {paragraph}
                    </p>
                  ),
                )}
            </div>
          </article>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
