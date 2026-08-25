"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import CompanyHistoryImagePicker from "./CompanyHistoryImagePicker";

type Locale = "zh" | "en";

type FieldErrors = Record<string, string[]>;

type ImageAsset = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
};

type Props = {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    time: string;
    content: string;
    sortOrder: number;
    imageAssetId: string | null;
    imageAsset: ImageAsset | null;
    historyYear: {
      locale: Locale;
      year: number;
      sortDate: string;
      sortOrder: number;
    };
  };
};

type ApiResponse =
  | {
      success: true;
      data: {
        id: string;
      };
    }
  | {
      success: false;
      error: {
        message: string;
        fieldErrors?: FieldErrors;
      };
    };

function getFirstError(errors: FieldErrors, key: string): string | undefined {
  return errors[key]?.[0];
}

export default function CompanyHistoryForm({ mode, initialData }: Props) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale | "">(initialData?.historyYear.locale ?? "");
  const [year, setYear] = useState(String(initialData?.historyYear.year ?? ""));
  const [time, setTime] = useState(initialData?.time ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [sortDate, setSortDate] = useState(initialData?.historyYear.sortDate ?? "");
  const [sortOrder, setSortOrder] = useState(String(initialData?.sortOrder ?? 0));
  const [image, setImage] = useState<ImageAsset | null>(initialData?.imageAsset ?? null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const nextErrors: FieldErrors = {};
    if (!locale) {
      nextErrors.locale = ["请选择内容语言"];
    }
    if (!year.trim()) {
      nextErrors.year = ["请输入年份"];
    }
    if (!time.trim()) {
      nextErrors.time = ["请输入事件时间"];
    }
    if (!content.trim()) {
      nextErrors.content = ["请输入事件内容"];
    }
    if (!sortDate) {
      nextErrors.sortDate = ["请选择排序时间"];
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    setServerError("");
    setSavedMessage("");

    try {
      const response = await fetch(
        mode === "create"
          ? "/api/admin/company-history"
          : `/api/admin/company-history/${initialData?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locale,
            year: Number(year),
            time: time.trim(),
            content: content.trim(),
            sortDate,
            sortOrder: Number(sortOrder || 0),
            imageAssetId: image?.id ?? null,
          }),
        },
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        setErrors(result.success ? {} : result.error.fieldErrors ?? {});
        throw new Error(result.success ? "保存失败" : result.error.message);
      }

      if (mode === "create") {
        router.push(`/admin/company-history/${result.data.id}/edit`);
        router.refresh();
        return;
      }

      setSavedMessage("保存成功");
      router.refresh();
    } catch (submitError) {
      setServerError(submitError instanceof Error ? submitError.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError ? (
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {serverError}
        </div>
      ) : null}

      {savedMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {savedMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">基本信息</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  内容语言 <span className="text-red-500">*</span>
                </span>
                <select
                  value={locale}
                  disabled={submitting}
                  onChange={(event) => setLocale(event.target.value as Locale | "")}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                >
                  <option value="">请选择内容语言</option>
                  <option value="zh">中文</option>
                  <option value="en">英文</option>
                </select>
                {getFirstError(errors, "locale") ? (
                  <p className="mt-1 text-xs text-red-600">
                    {getFirstError(errors, "locale")}
                  </p>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  年份 <span className="text-red-500">*</span>
                </span>
                <input
                  type="number"
                  value={year}
                  disabled={submitting}
                  onChange={(event) => setYear(event.target.value)}
                  placeholder="例如：2024"
                  min={1900}
                  max={2100}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                />
                {getFirstError(errors, "year") ? (
                  <p className="mt-1 text-xs text-red-600">
                    {getFirstError(errors, "year")}
                  </p>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  事件时间 <span className="text-red-500">*</span>
                </span>
                <input
                  value={time}
                  disabled={submitting}
                  maxLength={50}
                  onChange={(event) => setTime(event.target.value)}
                  placeholder="例如：6月 / June"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                />
                {getFirstError(errors, "time") ? (
                  <p className="mt-1 text-xs text-red-600">
                    {getFirstError(errors, "time")}
                  </p>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  排序时间 <span className="text-red-500">*</span>
                </span>
                <input
                  type="date"
                  value={sortDate}
                  disabled={submitting}
                  onChange={(event) => setSortDate(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                />
                <p className="mt-1 text-xs text-slate-500">
                  用于时间轴排序，官网不直接显示。
                </p>
                {getFirstError(errors, "sortDate") ? (
                  <p className="mt-1 text-xs text-red-600">
                    {getFirstError(errors, "sortDate")}
                  </p>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  排序值
                </span>
                <input
                  type="number"
                  value={sortOrder}
                  disabled={submitting}
                  min={-100000}
                  max={100000}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                />
                <p className="mt-1 text-xs text-slate-500">
                  相同排序时间时，数值越小越靠前。
                </p>
                {getFirstError(errors, "sortOrder") ? (
                  <p className="mt-1 text-xs text-red-600">
                    {getFirstError(errors, "sortOrder")}
                  </p>
                ) : null}
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  事件内容 <span className="text-red-500">*</span>
                </span>
                <textarea
                  value={content}
                  disabled={submitting}
                  maxLength={1000}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="描述这个历史事件..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {content.length}/1000 字符
                </p>
                {getFirstError(errors, "content") ? (
                  <p className="mt-1 text-xs text-red-600">
                    {getFirstError(errors, "content")}
                  </p>
                ) : null}
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <CompanyHistoryImagePicker
            selected={image}
            onChange={setImage}
            disabled={submitting}
            error={getFirstError(errors, "imageAssetId")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "create" ? "创建发展历程" : "保存修改"}
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={() => router.push("/admin/company-history")}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          返回列表
        </button>
      </div>
    </form>
  );
}
