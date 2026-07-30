"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import ApplicationCaseForm from "@/components/admin/application-cases/ApplicationCaseForm";

type ApplicationCaseLocale = "zh" | "en";

type ApplicationCaseData = {
  id: string;
  locale: ApplicationCaseLocale;
  title: string;
  slug: string;
  contentParagraphs: string[];
  caseDate: string;
  imageAssetId: string | null;
  imageAsset: {
    id: string;
    url: string;
    width: number | null;
    height: number | null;
    alt: string | null;
  } | null;
};

export default function EditApplicationCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<
    string | null
  >(null);

  const [data, setData] =
    useState<ApplicationCaseData | null>(
      null,
    );

  useEffect(() => {
    params.then(({ id: resolvedId }) => {
      setId(resolvedId);
    });
  }, [params]);

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/application-cases/${id}`,
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch application case",
          );
        }

        const result =
          await response.json();

        if (result.success) {
          const caseDateString = result.data
            .caseDate
            ? new Date(
                result.data.caseDate,
              )
              .toISOString()
              .split("T")[0]
            : "";

          setData({
            ...result.data,
            caseDate: caseDateString,
            contentParagraphs: Array.isArray(
              result.data.contentParagraphs,
            )
              ? result.data.contentParagraphs
              : [],
          });
        } else {
          setError(
            result.error?.message ||
              "Failed to load application case",
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load application case",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex gap-3 rounded-lg bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />

          <p className="text-sm text-red-800">
            {error}
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="rounded-lg border border-slate-300 bg-white px-6 py-2 text-slate-900 hover:bg-slate-50"
        >
          返回
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6 p-6">
        <p className="text-slate-600">
          应用案例不存在
        </p>

        <button
          onClick={() => router.back()}
          className="rounded-lg border border-slate-300 bg-white px-6 py-2 text-slate-900 hover:bg-slate-50"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">
          编辑应用案例
        </h1>

        <p className="text-sm text-slate-600">
          编辑应用案例信息
        </p>
      </div>

      <ApplicationCaseForm
        mode="edit"
        initialData={data}
      />
    </div>
  );
}
