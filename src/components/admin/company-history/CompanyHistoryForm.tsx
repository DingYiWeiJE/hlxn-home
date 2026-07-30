"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import CompanyHistoryImagePicker from "./CompanyHistoryImagePicker";
import CompanyHistoryParagraphsEditor, {
  createInitialParagraphs,
} from "./CompanyHistoryParagraphsEditor";

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
    locale: Locale;
    displayTime: string;
    sortDate: string;
    sortOrder: number;
    title: string | null;
    detailParagraphs: string[];
    imageAssetId: string | null;
    imageAsset: ImageAsset | null;
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
  const [locale, setLocale] = useState<Locale | "">(initialData?.locale ?? "");
  const [displayTime, setDisplayTime] = useState(initialData?.displayTime ?? "");
  const [sortDate, setSortDate] = useState(initialData?.sortDate ?? "");
  const [sortOrder, setSortOrder] = useState(String(initialData?.sortOrder ?? 0));
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [paragraphs, setParagraphs] = useState(() =>
    createInitialParagraphs(initialData?.detailParagraphs),
  );
  const [image, setImage] = useState<ImageAsset | null>(initialData?.imageAsset ?? null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cleanedParagraphs = useMemo(
    () => paragraphs.map((item) => item.value.trim()).filter(Boolean),
    [paragraphs],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const nextErrors: FieldErrors = {};
    if (!locale) {
      nextErrors.locale = ["请选择内容语言"];
    }
    if (!displayTime.trim()) {
      nextErrors.displayTime = ["请输入展示时间"];
    }
    if (!sortDate) {
      nextErrors.sortDate = ["请选择排序时间"];
    }
    if (cleanedParagraphs.length === 0) {
      nextErrors.detailParagraphs = ["事件详情至少需要一个非空自然段"];
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
            displayTime: displayTime.trim(),
            sortDate,
            sortOrder: Number(sortOrder || 0),
            title: title.trim() || null,
            detailParagraphs: cleanedParagraphs,
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
                  展示时间 <span className="text-red-500">*</span>
                </span>
                <input
                  value={displayTime}
                  disabled={submitting}
                  maxLength={100}
                  onChange={(event) => setDisplayTime(event.target.value)}
                  placeholder="例如：2024 年 6 月 / June 2024"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                />
                {getFirstError(errors, "displayTime") ? (
                  <p className="mt-1 text-xs text-red-600">
                    {getFirstError(errors, "displayTime")}
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
                  仅用于时间轴排序，官网不直接显示。
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
                  事件标题
                </span>
                <input
                  value={title}
                  disabled={submitting}
                  maxLength={200}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="可选，留空时官网不显示标题"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                />
                {getFirstError(errors, "title") ? (
                  <p className="mt-1 text-xs text-red-600">
                    {getFirstError(errors, "title")}
                  </p>
                ) : null}
              </label>
            </div>
          </section>

          <CompanyHistoryParagraphsEditor
            paragraphs={paragraphs}
            onChange={setParagraphs}
            disabled={submitting}
            error={getFirstError(errors, "detailParagraphs")}
          />
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
