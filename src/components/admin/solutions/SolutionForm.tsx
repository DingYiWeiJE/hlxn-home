"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Images,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";

import MediaAssetPicker, {
  type ProductMediaAsset,
  type ProductMediaPurpose,
} from "@/components/admin/products/MediaAssetPicker";

type SolutionLocale = "zh" | "en";
type SolutionStatus = "DRAFT" | "PUBLISHED";

type ImageAsset = {
  id: string;
  url: string;
  filename: string;
  originalName: string | null;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
};

type TextItem = {
  clientId: string;
  value: string;
};

type UsageScenarioItem = {
  clientId: string;
  title: string;
  detailParagraphs: TextItem[];
  imageAssetId: string | null;
  sortOrder: number;
  imageAsset: ImageAsset | null;
};

type CustomerValueItem = {
  clientId: string;
  title: string;
  detailParagraphs: TextItem[];
  imageAssetId: string | null;
  sortOrder: number;
  imageAsset: ImageAsset | null;
};

export type SolutionFormInitialData = {
  id: string;
  locale: SolutionLocale;
  title: string;
  subtitle: string | null;
  slug: string;
  status: SolutionStatus;
  sortOrder: number;
  translationKey: string | null;
  summaryParagraphs: unknown;
  highlights: unknown;
  workingPrincipleParagraphs: unknown;
  coverImageAssetId: string | null;
  coverImageAsset: ImageAsset | null;
  workingPrincipleBackgroundAssetId: string | null;
  workingPrincipleBackgroundAsset: ImageAsset | null;
  systemCompositionParagraphs: unknown;
  usageScenarios: Array<{
    id: string;
    title: string;
    detailParagraphs: unknown;
    sortOrder: number;
    imageAssetId: string | null;
    imageAsset: ImageAsset | null;
  }>;
  customerValues: Array<{
    id: string;
    title: string;
    detailParagraphs: unknown;
    sortOrder: number;
    imageAssetId: string | null;
    imageAsset: ImageAsset | null;
  }>;
  publishedAt: string | null;
  detailUrl: string;
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};

type SaveResponse =
  | {
      success: true;
      data: {
        id: string;
        locale: SolutionLocale;
        title: string;
        subtitle: string | null;
        slug: string;
      };
    }
  | ApiFailure;

type SolutionFormProps = {
  mode: "create" | "edit";
  initialData?: SolutionFormInitialData;
};

function createClientId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toStringArray(value: unknown, fallback = [""]): TextItem[] {
  const values = Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];

  const normalized = values.length > 0 ? values : fallback;

  return normalized.map((item) => ({
    clientId: createClientId(),
    value: item,
  }));
}

function normalizeTextItems(items: TextItem[]): string[] {
  return items.map((item) => item.value.trim()).filter(Boolean);
}

function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return offsetDate.toISOString().slice(0, 16);
}

function asImageAsset(asset: ProductMediaAsset): ImageAsset {
  return {
    id: asset.id,
    url: asset.url,
    filename: asset.filename,
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    size: asset.size,
    width: asset.width,
    height: asset.height,
    alt: asset.alt,
  };
}

function getErrorMessage(result: SaveResponse): string {
  if (!result.success) {
    const firstFieldError = Object.values(
      result.error.fieldErrors ?? {},
    ).flat()[0];

    return firstFieldError || result.error.message;
  }

  return "Request failed";
}

export default function SolutionForm({ mode, initialData }: SolutionFormProps) {
  const router = useRouter();

  const [locale, setLocale] = useState<SolutionLocale>(
    initialData?.locale ?? "zh",
  );
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle ?? "");
  const [status, setStatus] = useState<SolutionStatus>(
    initialData?.status ?? "DRAFT",
  );
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder ?? 0);
  const [publishedAt, setPublishedAt] = useState(
    toDateTimeLocal(initialData?.publishedAt),
  );
  const [translationKey, setTranslationKey] = useState(
    initialData?.translationKey ?? "",
  );

  const [summaryParagraphs, setSummaryParagraphs] = useState<TextItem[]>(
    toStringArray(initialData?.summaryParagraphs),
  );
  const [highlights, setHighlights] = useState<TextItem[]>(
    toStringArray(initialData?.highlights),
  );
  const [workingPrincipleParagraphs, setWorkingPrincipleParagraphs] =
    useState<TextItem[]>(toStringArray(initialData?.workingPrincipleParagraphs));
  const [systemCompositionParagraphs, setSystemCompositionParagraphs] =
    useState<TextItem[]>(
      toStringArray(initialData?.systemCompositionParagraphs, [""]),
    );

  const [
    workingPrincipleBackgroundAssetId,
    setWorkingPrincipleBackgroundAssetId,
  ] = useState(initialData?.workingPrincipleBackgroundAssetId ?? "");
  const [workingPrincipleBackgroundAsset, setWorkingPrincipleBackgroundAsset] =
    useState<ImageAsset | null>(
      initialData?.workingPrincipleBackgroundAsset ?? null,
    );

  const [coverImageAssetId, setCoverImageAssetId] = useState(
    initialData?.coverImageAssetId ?? "",
  );
  const [coverImageAsset, setCoverImageAsset] = useState<ImageAsset | null>(
    initialData?.coverImageAsset ?? null,
  );

  const [usageScenarios, setUsageScenarios] = useState<UsageScenarioItem[]>(
    () =>
      (initialData?.usageScenarios ?? []).map((item) => ({
        clientId: item.id || createClientId(),
        title: item.title,
        detailParagraphs: toStringArray(item.detailParagraphs, [""]),
        sortOrder: item.sortOrder,
        imageAssetId: item.imageAssetId,
        imageAsset: item.imageAsset,
      })),
  );

  const [customerValues, setCustomerValues] = useState<CustomerValueItem[]>(
    () =>
      (initialData?.customerValues ?? []).map((item) => ({
        clientId: item.id || createClientId(),
        title: item.title,
        detailParagraphs: toStringArray(item.detailParagraphs),
        sortOrder: item.sortOrder,
        imageAssetId: item.imageAssetId,
        imageAsset: item.imageAsset,
      })),
  );

  const [picker, setPicker] = useState<
    | {
        target: "cover" | "working";
        index?: undefined;
      }
    | {
        target: "usage" | "customer";
        index: number;
      }
    | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const pickerPurpose = useMemo<ProductMediaPurpose>(() => {
    if (!picker) {
      return "SOLUTION_WORKING_PRINCIPLE_BACKGROUND";
    }

    if (picker.target === "cover") {
      return "GENERAL";
    }

    if (picker.target === "working") {
      return "SOLUTION_WORKING_PRINCIPLE_BACKGROUND";
    }

    return picker.target === "usage"
      ? "SOLUTION_USAGE_SCENARIO"
      : "SOLUTION_CUSTOMER_VALUE";
  }, [picker]);

  const selectedPickerAssetId = useMemo(() => {
    if (!picker) {
      return null;
    }

    if (picker.target === "cover") {
      return coverImageAssetId;
    }

    if (picker.target === "working") {
      return workingPrincipleBackgroundAssetId;
    }

    if (picker.target === "usage" && picker.index !== undefined) {
      return usageScenarios[picker.index]?.imageAssetId ?? null;
    }

    if (picker.target === "customer" && picker.index !== undefined) {
      return customerValues[picker.index]?.imageAssetId ?? null;
    }

    return null;
  }, [
    customerValues,
    coverImageAssetId,
    picker,
    usageScenarios,
    workingPrincipleBackgroundAssetId,
  ]);

  function selectAsset(asset: ProductMediaAsset) {
    if (!picker) {
      return;
    }

    const imageAsset = asImageAsset(asset);

    if (picker.target === "cover") {
      setCoverImageAssetId(asset.id);
      setCoverImageAsset(imageAsset);
      return;
    }

    if (picker.target === "working") {
      setWorkingPrincipleBackgroundAssetId(asset.id);
      setWorkingPrincipleBackgroundAsset(imageAsset);
      return;
    }

    if (picker.target === "usage") {
      setUsageScenarios((items) =>
        items.map((item, index) =>
          index === picker.index
            ? {
                ...item,
                imageAssetId: asset.id,
                imageAsset,
              }
            : item,
        ),
      );
      return;
    }

    setCustomerValues((items) =>
      items.map((item, index) =>
        index === picker.index
          ? {
              ...item,
              imageAssetId: asset.id,
              imageAsset,
            }
          : item,
      ),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      locale,
      title,
      subtitle: subtitle || null,
      status,
      sortOrder,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
      translationKey: translationKey.trim() || null,
      coverImageAssetId,
      summaryParagraphs: normalizeTextItems(summaryParagraphs),
      highlights: normalizeTextItems(highlights),
      workingPrincipleParagraphs: normalizeTextItems(
        workingPrincipleParagraphs,
      ),
      workingPrincipleBackgroundAssetId,
      systemCompositionParagraphs: normalizeTextItems(
        systemCompositionParagraphs,
      ),
      usageScenarios: usageScenarios.map((item, index) => ({
        title: item.title,
        detailParagraphs: normalizeTextItems(item.detailParagraphs),
        imageAssetId: item.imageAssetId,
        sortOrder: index,
      })),
      customerValues: customerValues.map((item, index) => ({
        title: item.title,
        detailParagraphs: normalizeTextItems(item.detailParagraphs),
        imageAssetId: item.imageAssetId,
        sortOrder: index,
      })),
    };

    try {
      const response = await fetch(
        mode === "create"
          ? "/api/admin/solutions"
          : `/api/admin/solutions/${initialData?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      const result = (await response.json()) as SaveResponse;

      if (!response.ok || !result.success) {
        throw new Error(getErrorMessage(result));
      }

      if (mode === "create") {
        router.replace(`/admin/solutions/${result.data.id}/edit`);
        router.refresh();
        return;
      }

      setSuccess("保存成功");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "保存失败",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/solutions"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              返回解决方案列表
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">
              {mode === "create" ? "新建解决方案" : "编辑解决方案"}
            </h1>
            {initialData ? (
              <p className="mt-1 text-sm text-slate-500">
                Slug: {initialData.slug}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSubmitting ? "保存中..." : "保存"}
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}
        

        <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-3">
          <div className="md:col-span-2 grid gap-5 grid-cols-2">

          <InputBlock label="语言" required>
            <select
              value={locale}
              onChange={(event) =>
                setLocale(event.target.value === "en" ? "en" : "zh")
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </InputBlock>

          <InputBlock label="状态" required>
            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">发布</option>
            </select>
          </InputBlock>

          <InputBlock label="主标题" required>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={200}
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </InputBlock>

          <InputBlock label="副标题">
            <input
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
              maxLength={200}
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </InputBlock>

          <InputBlock label="排序值">
            <input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(Math.max(0, Number(event.target.value) || 0))
              }
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </InputBlock>

          <InputBlock label="发布时间">
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={(event) => setPublishedAt(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </InputBlock>

          <InputBlock label="多语言关联标识">
            <input
              value={translationKey}
              onChange={(event) => setTranslationKey(event.target.value)}
              placeholder="marine-zero-carbon-energy"
              maxLength={160}
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </InputBlock>
          </div>

          <ImagePickerBox
            label="解决方案封面图"
            asset={coverImageAsset}
            onPick={() => setPicker({ target: "cover" })}
            onClear={() => {
              setCoverImageAssetId("");
              setCoverImageAsset(null);
            }}
          />
        </section>

        <TextListEditor
          title="解决方案简介"
          required
          multiline
          items={summaryParagraphs}
          onChange={setSummaryParagraphs}
        />

        <TextListEditor
          title="解决方案亮点"
          required
          items={highlights}
          onChange={setHighlights}
          maxLength={300}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-1">
            <h2 className="text-base font-bold text-slate-900">工作原理</h2>
            <span className="text-red-500">*</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <TextListEditor
              title="工作原理自然段"
              required
              multiline
              items={workingPrincipleParagraphs}
              onChange={setWorkingPrincipleParagraphs}
              embedded
            />

            <ImagePickerBox
              label="工作原理背景图"
              asset={workingPrincipleBackgroundAsset}
              onPick={() => setPicker({ target: "working" })}
              onClear={() => {
                setWorkingPrincipleBackgroundAssetId("");
                setWorkingPrincipleBackgroundAsset(null);
              }}
            />
          </div>
        </section>

        <TextListEditor
          title="系统构成"
          multiline
          items={systemCompositionParagraphs}
          onChange={setSystemCompositionParagraphs}
        />

        <UsageScenariosEditor
          items={usageScenarios}
          onChange={setUsageScenarios}
          onPick={(index) => setPicker({ target: "usage", index })}
        />

        <CustomerValuesEditor
          items={customerValues}
          onChange={setCustomerValues}
          onPick={(index) => setPicker({ target: "customer", index })}
        />
      </form>

      <MediaAssetPicker
        open={picker !== null}
        type="IMAGE"
        title={
          picker?.target === "cover"
            ? "选择或上传解决方案封面图"
            : "选择或上传解决方案图片"
        }
        purpose={pickerPurpose}
        selectedAssetId={selectedPickerAssetId}
        uploadAlt={title || "solution image"}
        onSelect={selectAsset}
        onClose={() => setPicker(null)}
      />
    </>
  );
}

function InputBlock({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function TextListEditor({
  title,
  items,
  onChange,
  required = false,
  multiline = false,
  embedded = false,
  maxLength = 5000,
}: {
  title: string;
  items: TextItem[];
  onChange: (items: TextItem[]) => void;
  required?: boolean;
  multiline?: boolean;
  embedded?: boolean;
  maxLength?: number;
}) {
  function addItem() {
    onChange([...items, { clientId: createClientId(), value: "" }]);
  }

  function updateItem(clientId: string, value: string) {
    onChange(
      items.map((item) => (item.clientId === clientId ? { ...item, value } : item)),
    );
  }

  function removeItem(clientId: string) {
    onChange(items.filter((item) => item.clientId !== clientId));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= items.length) {
      return;
    }

    const nextItems = [...items];
    [nextItems[index], nextItems[nextIndex]] = [
      nextItems[nextIndex],
      nextItems[index],
    ];
    onChange(nextItems);
  }

  return (
    <section
      className={
        embedded ? "rounded-xl border border-slate-200" : "rounded-2xl border border-slate-200 bg-white"
      }
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-1">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {required ? <span className="text-red-500">*</span> : null}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          <Plus className="h-3.5 w-3.5" />
          添加
        </button>
      </header>

      <div className="space-y-3 p-5">
        {items.map((item, index) => (
          <div key={item.clientId} className="flex items-start gap-3">
            <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              {multiline ? (
                <textarea
                  value={item.value}
                  required={required}
                  maxLength={maxLength}
                  rows={4}
                  onChange={(event) => updateItem(item.clientId, event.target.value)}
                  className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              ) : (
                <input
                  value={item.value}
                  required={required}
                  maxLength={maxLength}
                  onChange={(event) => updateItem(item.clientId, event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              )}
            </div>
            <MoveButtons
              index={index}
              total={items.length}
              onMove={moveItem}
              onRemove={() => removeItem(item.clientId)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function MoveButtons({
  index,
  total,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mt-1 flex shrink-0 items-center gap-1">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(index, -1)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={index === total - 1}
        onClick={() => onMove(index, 1)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
      >
        <ArrowDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function ImagePickerBox({
  label,
  asset,
  onPick,
  onClear,
  required = false,
}: {
  label: string;
  asset: ImageAsset | null;
  onPick: () => void;
  onClear: () => void;
  required?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-sm font-semibold text-slate-800">
          {label}
          {required ? <span className="text-red-500">*</span> : null}
        </div>
        {asset ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onPick}
        className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white"
      >
        {asset ? (
          <Image
            src={asset.url}
            alt={asset.alt || asset.originalName || label}
            fill
            sizes="360px"
            className="object-contain p-3"
          />
        ) : (
          <span className="flex flex-col items-center text-sm font-semibold text-slate-400">
            <Images className="mb-2 h-8 w-8" />
            选择或上传图片
          </span>
        )}
      </button>
    </div>
  );
}

function UsageScenariosEditor({
  items,
  onChange,
  onPick,
}: {
  items: UsageScenarioItem[];
  onChange: (items: UsageScenarioItem[]) => void;
  onPick: (index: number) => void;
}) {
  function addItem() {
    onChange([
      ...items,
      {
        clientId: createClientId(),
        title: "",
        detailParagraphs: [{ clientId: createClientId(), value: "" }],
        imageAssetId: "",
        sortOrder: items.length,
        imageAsset: null,
      },
    ]);
  }

  function updateItem(clientId: string, patch: Partial<UsageScenarioItem>) {
    onChange(items.map((item) => (item.clientId === clientId ? { ...item, ...patch } : item)));
  }

  function removeItem(clientId: string) {
    onChange(items.filter((item) => item.clientId !== clientId));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= items.length) {
      return;
    }

    const nextItems = [...items];
    [nextItems[index], nextItems[nextIndex]] = [
      nextItems[nextIndex],
      nextItems[index],
    ];
    onChange(nextItems.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex })));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <EditorHeader title="使用场景" onAdd={addItem} />
      <div className="grid gap-4 p-5 md:grid-cols-2">
        {items.map((item, index) => (
          <article key={item.clientId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <ImagePickerBox
              label={`场景图片 ${index + 1}`}
              required
              asset={item.imageAsset}
              onPick={() => onPick(index)}
              onClear={() => updateItem(item.clientId, { imageAssetId: "", imageAsset: null })}
            />
            <input
              value={item.title}
              required
              maxLength={200}
              onChange={(event) => updateItem(item.clientId, { title: event.target.value })}
              placeholder="场景标题"
              className="mt-4 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <div className="mt-4">
              <TextListEditor
                title="场景详情自然段"
                multiline
                embedded
                items={item.detailParagraphs}
                onChange={(detailParagraphs) =>
                  updateItem(item.clientId, { detailParagraphs })
                }
              />
            </div>
            <div className="mt-4 flex justify-end">
              <MoveButtons
                index={index}
                total={items.length}
                onMove={moveItem}
                onRemove={() => removeItem(item.clientId)}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CustomerValuesEditor({
  items,
  onChange,
  onPick,
}: {
  items: CustomerValueItem[];
  onChange: (items: CustomerValueItem[]) => void;
  onPick: (index: number) => void;
}) {
  function addItem() {
    onChange([
      ...items,
      {
        clientId: createClientId(),
        title: "",
        detailParagraphs: [{ clientId: createClientId(), value: "" }],
        imageAssetId: "",
        sortOrder: items.length,
        imageAsset: null,
      },
    ]);
  }

  function updateItem(clientId: string, patch: Partial<CustomerValueItem>) {
    onChange(items.map((item) => (item.clientId === clientId ? { ...item, ...patch } : item)));
  }

  function removeItem(clientId: string) {
    onChange(items.filter((item) => item.clientId !== clientId));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= items.length) {
      return;
    }

    const nextItems = [...items];
    [nextItems[index], nextItems[nextIndex]] = [
      nextItems[nextIndex],
      nextItems[index],
    ];
    onChange(nextItems.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex })));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <EditorHeader title="客户价值" onAdd={addItem} />
      <div className="space-y-5 p-5">
        {items.map((item, index) => (
          <article key={item.clientId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <input
                  value={item.title}
                  required
                  maxLength={200}
                  onChange={(event) => updateItem(item.clientId, { title: event.target.value })}
                  placeholder="客户价值标题"
                  className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <TextListEditor
                  title="详情自然段"
                  required
                  multiline
                  embedded
                  items={item.detailParagraphs}
                  onChange={(detailParagraphs) =>
                    updateItem(item.clientId, { detailParagraphs })
                  }
                />
              </div>
              <ImagePickerBox
                label={`客户价值图片 ${index + 1}`}
                required
                asset={item.imageAsset}
                onPick={() => onPick(index)}
                onClear={() => updateItem(item.clientId, { imageAssetId: "", imageAsset: null })}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <MoveButtons
                index={index}
                total={items.length}
                onMove={moveItem}
                onRemove={() => removeItem(item.clientId)}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EditorHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
      >
        <Plus className="h-3.5 w-3.5" />
        添加
      </button>
    </header>
  );
}
