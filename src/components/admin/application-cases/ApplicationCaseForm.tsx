"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Loader2,
} from "lucide-react";

import ApplicationCaseImageUploader from "./ApplicationCaseImageUploader";
import ParagraphsEditor from "./ParagraphsEditor";

type ApplicationCaseLocale = "zh" | "en";

type ApplicationCaseFormProps = {
  mode: "create" | "edit";
  initialData?: {
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
};

export default function ApplicationCaseForm({
  mode,
  initialData,
}: ApplicationCaseFormProps) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState<
    Record<string, string[]>
  >({});

  const [serverError, setServerError] =
    useState<string | null>(null);

  const [locale, setLocale] =
    useState<ApplicationCaseLocale | "">(
      initialData?.locale ?? "",
    );

  const [title, setTitle] = useState(
    initialData?.title ?? "",
  );

  const [contentParagraphs, setContentParagraphs] =
    useState<string[]>(
      initialData?.contentParagraphs ?? [],
    );

  const [caseDate, setCaseDate] = useState(
    initialData?.caseDate ?? "",
  );

  const [imageAssetId, setImageAssetId] =
    useState<string | null>(
      initialData?.imageAssetId ?? null,
    );

  const [imageUrl, setImageUrl] =
    useState<string | null>(
      initialData?.imageAsset?.url ?? null,
    );

  const [imageAlt, setImageAlt] =
    useState<string | null>(
      initialData?.imageAsset?.alt ?? null,
    );

  const [imageWidth, setImageWidth] =
    useState<number | null>(
      initialData?.imageAsset?.width ?? null,
    );

  const [imageHeight, setImageHeight] =
    useState<number | null>(
      initialData?.imageAsset?.height ?? null,
    );

  const handleImageAssetIdChange = useCallback(
    (
      id: string | null,
      asset?: {
        url: string;
        alt: string | null;
        width: number | null;
        height: number | null;
      },
    ) => {
      setImageAssetId(id);

      if (id && asset) {
        setImageUrl(asset.url);
        setImageAlt(asset.alt);
        setImageWidth(asset.width);
        setImageHeight(asset.height);
      } else {
        setImageUrl(null);
        setImageAlt(null);
        setImageWidth(null);
        setImageHeight(null);
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setError({});

      setServerError(null);

      if (!locale) {
        setError((prev) => ({
          ...prev,
          locale: ["请选择语言"],
        }));

        return;
      }

      if (!title.trim()) {
        setError((prev) => ({
          ...prev,
          title: ["请输入标题"],
        }));

        return;
      }

      const cleanedParagraphs =
        contentParagraphs
          .map((p) => p.trim())
          .filter(Boolean);

      if (cleanedParagraphs.length === 0) {
        setError((prev) => ({
          ...prev,
          contentParagraphs: [
            "至少需要一个非空自然段",
          ],
        }));

        return;
      }

      if (!caseDate) {
        setError((prev) => ({
          ...prev,
          caseDate: ["请选择日期"],
        }));

        return;
      }

      if (!imageAssetId) {
        setError((prev) => ({
          ...prev,
          imageAssetId: [
            "请上传应用案例图片",
          ],
        }));

        return;
      }

      setLoading(true);

      try {
        const url =
          mode === "create"
            ? "/api/admin/application-cases"
            : `/api/admin/application-cases/${initialData?.id}`;

        const method =
          mode === "create"
            ? "POST"
            : "PATCH";

        const response = await fetch(
          url,
          {
            method,
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              locale,
              title: title.trim(),
              contentParagraphs:
                cleanedParagraphs,
              caseDate: new Date(
                caseDate,
              ).toISOString(),
              imageAssetId,
            }),
          },
        );

        const data =
          await response.json();

        if (data.success) {
          if (mode === "create") {
            router.push(
              `/admin/application-cases`,
            );
          } else {
            router.push(
              `/admin/application-cases`,
            );
          }
        } else {
          if (
            data.error?.fieldErrors
          ) {
            setError(
              data.error.fieldErrors,
            );
          } else {
            setServerError(
              data.error?.message ||
                "保存失败",
            );
          }
        }
      } catch (err) {
        setServerError(
          err instanceof Error
            ? err.message
            : "保存失败",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      locale,
      title,
      contentParagraphs,
      caseDate,
      imageAssetId,
      mode,
      initialData?.id,
      router,
    ],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {serverError && (
        <div className="flex gap-3 rounded-lg bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />

          <p className="text-sm text-red-800">
            {serverError}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              基本信息
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  语言
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <select
                  value={locale}
                  onChange={(e) =>
                    setLocale(
                      e.target
                        .value as ApplicationCaseLocale | ""
                    )
                  }
                  disabled={
                    mode === "edit"
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                >
                  <option value="">
                    请选择语言
                  </option>

                  <option value="zh">
                    中文
                  </option>

                  <option value="en">
                    英文
                  </option>
                </select>

                {error.locale && (
                  <p className="mt-1 text-xs text-red-600">
                    {error.locale[0]}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  标题
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value,
                    )
                  }
                  maxLength={200}
                  placeholder="输入应用案例标题..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <div className="mt-1 flex justify-between">
                  {error.title && (
                    <p className="text-xs text-red-600">
                      {error.title[0]}
                    </p>
                  )}

                  <p className="ml-auto text-xs text-slate-500">
                    {title.length} / 200
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  日期
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="date"
                  value={caseDate}
                  onChange={(e) =>
                    setCaseDate(
                      e.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                {error.caseDate && (
                  <p className="mt-1 text-xs text-red-600">
                    {error.caseDate[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
            <ParagraphsEditor
              paragraphs={
                contentParagraphs
              }
              onParagraphsChange={
                setContentParagraphs
              }
              disabled={loading}
            />

            {error.contentParagraphs && (
              <p className="text-xs text-red-600">
                {
                  error.contentParagraphs[
                    0
                  ]
                }
              </p>
            )}
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
            <ApplicationCaseImageUploader
              imageAssetId={imageAssetId}
              imageUrl={imageUrl}
              imageAlt={imageAlt}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              onImageAssetIdChange={
                handleImageAssetIdChange
              }
              disabled={loading}
            />

            {error.imageAssetId && (
              <p className="text-xs text-red-600">
                {error.imageAssetId[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}

          {mode === "create"
            ? "创建"
            : "保存"}
        </button>

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="rounded-lg border border-slate-300 bg-white px-6 py-2 text-slate-900 hover:bg-slate-50"
        >
          取消
        </button>
      </div>
    </form>
  );
}
