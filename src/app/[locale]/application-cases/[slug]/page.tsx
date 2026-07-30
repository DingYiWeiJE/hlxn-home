"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";

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

export default function ApplicationCaseDetail() {
  const params = useParams();
  const [caseData, setCaseData] =
    useState<ApplicationCase | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<
    string | null
  >(null);

  const locale = params.locale as string;
  const slug = params.slug as string;

  useEffect(() => {
    async function fetchCaseDetail() {
      try {
        const response = await fetch(
          `/api/application-cases/${slug}?locale=${locale}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch case");
        }

        const data =
          await response.json();

        if (data.success) {
          setCaseData(data.data);
        } else {
          setError(
            data.error?.message ||
              "Failed to load case",
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load case",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchCaseDetail();
  }, [locale, slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2463c5]" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />

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

        <Footer locale={locale} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <main className="flex-1">
        <div className="mx-auto max-w-[1280px] px-5 md:px-8 py-12">
          <Link
            href={`/${locale}/cases`}
            className="inline-flex items-center gap-2 text-[#2463c5] hover:underline mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === "zh"
              ? "返回应用案例"
              : "Back to Cases"}
          </Link>

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
              <h1 className="text-4xl md:text-5xl font-bold text-[#102a43] mb-4">
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

      <Footer locale={locale} />
    </div>
  );
}
