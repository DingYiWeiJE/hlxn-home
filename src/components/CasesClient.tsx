"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type ApplicationCase = {
  id: string;
  title: string;
  slug: string;
  caseDate: string;
  contentParagraphs: string[];
  imageAsset: {
    id: string;
    url: string;
    width: number | null;
    height: number | null;
    alt: string | null;
  } | null;
};

type CasesClientProps = {
  locale: string;
};

export default function CasesClient({ locale }: CasesClientProps) {
  const [cases, setCases] = useState<ApplicationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCases() {
      try {
        const response = await fetch(
          `/api/application-cases?locale=${locale}&pageSize=100`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch cases");
        }

        const data = await response.json();

        if (data.success) {
          setCases(data.data.items || []);
        } else {
          setError(data.error?.message || "Failed to load cases");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load cases",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchCases();
  }, [locale]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#2463c5]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-800">
        {error}
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        {locale === "zh" ? "暂无应用案例" : "No cases available"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
      {cases.map((item) => (
        <article key={item.id} className="group overflow-hidden">
          {item.imageAsset && (
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={item.imageAsset.url}
                alt={item.imageAsset.alt || item.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
          )}

          <div className="pt-7">
            <h3 className="text-xl font-bold leading-8 text-[#102a43] md:text-2xl">
              {item.title}
            </h3>

            {item.contentParagraphs &&
              item.contentParagraphs.length > 0 && (
                <p className="mt-5 text-[15px] leading-8 text-[#334e68] md:text-base line-clamp-3">
                  {item.contentParagraphs[0]}
                </p>
              )}

            <div className="mt-6 flex items-center justify-between">
              <time className="text-lg font-bold text-[#102a43]">
                {new Date(item.caseDate).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </time>

              <a
                href={`/${locale}/application-cases/${item.slug}`}
                className="text-[#2463c5] font-semibold transition hover:translate-x-1"
              >
                {locale === "zh" ? "查看详情 →" : "View Details →"}
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
