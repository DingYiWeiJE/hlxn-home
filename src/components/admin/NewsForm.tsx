"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import NewsEditor from "./NewsEditor";
import type { TiptapNode } from "@/lib/news/tiptap";

export type NewsMediaAsset = {
  id: string;
  url: string;
  filename?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
};

type NewsLocale = "zh" | "en";
type NewsStatus = "DRAFT" | "PUBLISHED";
type NewsSourceType = "MANUAL" | "WECHAT";

type NewsFormState = {
  title: string;
  locale: NewsLocale;
  summary: string;

  coverImageAssetId: string | null;
  coverImageAlt: string;

  authorName: string;
  status: NewsStatus;
  isFeatured: boolean;
  publishedAt: string;

  content: TiptapNode;

  sourceType: NewsSourceType;
  sourceUrl: string;
  sourceAccountName: string;
  sourceArticleId: string;
  sourcePublishedAt: string;
  importMeta: unknown;
};

export type NewsFormInitialValue = Partial<NewsFormState> & {
  coverImageAsset?: NewsMediaAsset | null;

  /*
   * 临时兼容旧编辑页传入的数据。
   * 新表单不会提交或编辑 slug。
   */
  slug?: string;

  /*
   * 临时兼容旧的封面 URL 返回结构。
   */
  coverImage?: string | null;
};

type Props = {
  mode: "create" | "edit";
  id?: string;
  initialValue?: NewsFormInitialValue;
};

type FieldErrors = Record<string, string[]>;

type ApiErrorData = {
  code?: string;
  message?: string;
  fieldErrors?: FieldErrors;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiErrorData;
};

type ImportedWechatArticle = {
  title: string;
  summary?: string | null;
  authorName?: string | null;

  coverImageAssetId?: string | null;
  coverImageAsset?: NewsMediaAsset | null;
  coverImageAlt?: string | null;

  content: TiptapNode;

  sourceType: "WECHAT";
  sourceUrl: string;
  sourceAccountName?: string | null;
  sourceArticleId?: string | null;
  sourcePublishedAt?: string | null;

  importMeta?: unknown;
};

const emptyContent: TiptapNode = {
  type: "doc",
  content: [],
};

function toDateTimeLocal(
  value: string | Date | null | undefined,
) {
  if (!value) {
    return "";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset =
    date.getTimezoneOffset() * 60_000;

  return new Date(
    date.getTime() - offset,
  )
    .toISOString()
    .slice(0, 16);
}

function toIsoDateTime(
  value: string,
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function formatFileSize(
  value?: number | null,
) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(
      value / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    value /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

function createInitialForm(
  value?: NewsFormInitialValue,
): NewsFormState {
  return {
    title:
      value?.title ?? "",

    locale:
      value?.locale ?? "zh",

    summary:
      value?.summary ?? "",

    coverImageAssetId:
      value?.coverImageAssetId ??
      value?.coverImageAsset?.id ??
      null,

    coverImageAlt:
      value?.coverImageAlt ?? "",

    authorName:
      value?.authorName ?? "",

    status:
      value?.status ?? "DRAFT",

    isFeatured:
      value?.isFeatured ?? false,

    publishedAt:
      toDateTimeLocal(
        value?.publishedAt,
      ),

    content:
      value?.content ??
      emptyContent,

    sourceType:
      value?.sourceType ??
      "MANUAL",

    sourceUrl:
      value?.sourceUrl ?? "",

    sourceAccountName:
      value?.sourceAccountName ??
      "",

    sourceArticleId:
      value?.sourceArticleId ??
      "",

    sourcePublishedAt:
      toDateTimeLocal(
        value?.sourcePublishedAt,
      ),

    importMeta:
      value?.importMeta ?? null,
  };
}

function createInitialCover(
  value?: NewsFormInitialValue,
): NewsMediaAsset | null {
  if (value?.coverImageAsset) {
    return value.coverImageAsset;
  }

  if (value?.coverImage) {
    return {
      id:
        value.coverImageAssetId ??
        "",
      url: value.coverImage,
      originalName:
        "当前新闻封面",
    };
  }

  return null;
}

function hasEditorContent(
  content: TiptapNode,
) {
  return (
    Array.isArray(content.content) &&
    content.content.length > 0
  );
}

export default function NewsForm({
  mode,
  id,
  initialValue,
}: Props) {
  const router = useRouter();

  const initialForm = useMemo(
    () =>
      createInitialForm(
        initialValue,
      ),
    [initialValue],
  );

  const initialSnapshot =
    useMemo(
      () =>
        JSON.stringify(
          initialForm,
        ),
      [initialForm],
    );

  const [form, setForm] =
    useState<NewsFormState>(
      initialForm,
    );

  const [
    selectedCover,
    setSelectedCover,
  ] = useState<
    NewsMediaAsset | null
  >(
    createInitialCover(
      initialValue,
    ),
  );

  const [
    editorVersion,
    setEditorVersion,
  ] = useState(0);

  const [
    savingAction,
    setSavingAction,
  ] = useState<
    "save" | "draft" | "publish" | null
  >(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    fieldErrors,
    setFieldErrors,
  ] = useState<FieldErrors>(
    {},
  );

  const [
    wechatUrl,
    setWechatUrl,
  ] = useState("");

  const [
    importing,
    setImporting,
  ] = useState(false);

  const [
    importError,
    setImportError,
  ] = useState("");

  const [
    coverPickerOpen,
    setCoverPickerOpen,
  ] = useState(false);

  const [
    allowNavigation,
    setAllowNavigation,
  ] = useState(false);

  const dirty = useMemo(
    () =>
      JSON.stringify(form) !==
      initialSnapshot,
    [form, initialSnapshot],
  );

  useEffect(() => {
    const beforeUnload = (
      event: BeforeUnloadEvent,
    ) => {
      if (
        !dirty ||
        allowNavigation
      ) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener(
      "beforeunload",
      beforeUnload,
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        beforeUnload,
      );
    };
  }, [
    dirty,
    allowNavigation,
  ]);

  function updateForm<
    K extends keyof NewsFormState,
  >(
    key: K,
    value: NewsFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setFieldErrors(
      (current) => {
        if (!current[key]) {
          return current;
        }

        const next = {
          ...current,
        };

        delete next[key];

        return next;
      },
    );
  }

  function validateBeforeSubmit() {
    const errors:
      FieldErrors = {};

    if (!form.locale) {
      errors.locale = [
        "请选择新闻语言",
      ];
    }

    if (!form.title.trim()) {
      errors.title = [
        "请输入新闻标题",
      ];
    }

    if (
      form.sourceType ===
        "WECHAT" &&
      !form.sourceUrl.trim()
    ) {
      errors.sourceUrl = [
        "微信公众号新闻必须保留原文地址",
      ];
    }

    if (
      form.publishedAt &&
      !toIsoDateTime(
        form.publishedAt,
      )
    ) {
      errors.publishedAt = [
        "发布时间格式不正确",
      ];
    }

    if (
      form.sourcePublishedAt &&
      !toIsoDateTime(
        form.sourcePublishedAt,
      )
    ) {
      errors.sourcePublishedAt =
        [
          "原文发布时间格式不正确",
        ];
    }

    setFieldErrors(errors);

    return (
      Object.keys(errors)
        .length === 0
    );
  }

  async function submit(
    action:
      | "save"
      | "draft"
      | "publish",
  ) {
    if (!validateBeforeSubmit()) {
      setError(
        "请检查表单中的错误",
      );

      return;
    }

    setSavingAction(action);
    setError("");
    setFieldErrors({});

    const nextStatus:
      NewsStatus =
      action === "publish"
        ? "PUBLISHED"
        : action === "draft"
          ? "DRAFT"
          : form.status;

    const payload = {
      title:
        form.title.trim(),

      locale:
        form.locale,

      summary:
        form.summary.trim() ||
        null,

      coverImageAssetId:
        form.coverImageAssetId ||
        null,

      coverImageAlt:
        form.coverImageAlt.trim() ||
        null,

      content:
        form.content,

      authorName:
        form.authorName.trim() ||
        null,

      status:
        nextStatus,

      isFeatured:
        form.isFeatured,

      publishedAt:
        form.publishedAt
          ? toIsoDateTime(
              form.publishedAt,
            )
          : null,

      sourceType:
        form.sourceType,

      sourceUrl:
        form.sourceUrl.trim() ||
        null,

      sourceAccountName:
        form.sourceAccountName.trim() ||
        null,

      sourceArticleId:
        form.sourceArticleId.trim() ||
        null,

      sourcePublishedAt:
        form.sourcePublishedAt
          ? toIsoDateTime(
              form.sourcePublishedAt,
            )
          : null,

      importMeta:
        form.importMeta ??
        null,
    };

    try {
      const response =
        await fetch(
          mode === "create"
            ? "/api/news"
            : `/api/news/${id}`,
          {
            method:
              mode === "create"
                ? "POST"
                : "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        );

      const result =
        (await response.json()) as ApiResponse<{
          id: string;
        }>;

      if (
        !response.ok ||
        !result.success
      ) {
        const message =
          result.error?.message ??
          "新闻保存失败";

        const sourceUrlMessage =
          result.error
            ?.fieldErrors
            ?.sourceUrl?.[0];

        const duplicateWechatArticle =
          response.status === 409 &&
          result.error?.code ===
            "BAD_REQUEST" &&
          Boolean(sourceUrlMessage);

        if (duplicateWechatArticle) {
          window.alert(
            sourceUrlMessage ||
              message,
          );
        }

        setError(message);

        setFieldErrors(
          result.error
            ?.fieldErrors ?? {},
        );

        return;
      }

      setAllowNavigation(true);

      router.replace(
        "/admin/news",
      );

      router.refresh();
    } catch {
      setError(
        "网络请求失败，请稍后重试",
      );
    } finally {
      setSavingAction(null);
    }
  }

  async function importWechatArticle() {
    const urlText =
      wechatUrl.trim();

    if (!urlText) {
      setImportError(
        "请粘贴微信公众号文章地址",
      );

      return;
    }

    try {
      const url =
        new URL(urlText);

      const validHostname =
        url.hostname ===
          "mp.weixin.qq.com" ||
        url.hostname.endsWith(
          ".mp.weixin.qq.com",
        );

      if (
        url.protocol !==
          "https:" ||
        !validHostname
      ) {
        setImportError(
          "仅支持 https://mp.weixin.qq.com 的公众号文章地址",
        );

        return;
      }
    } catch {
      setImportError(
        "微信公众号文章地址格式不正确",
      );

      return;
    }

    const formHasContent =
      Boolean(
        form.title.trim(),
      ) ||
      Boolean(
        form.summary.trim(),
      ) ||
      hasEditorContent(
        form.content,
      );

    if (
      formHasContent &&
      !window.confirm(
        "导入公众号文章会覆盖当前标题、摘要、作者、封面和正文，是否继续？",
      )
    ) {
      return;
    }

    setImporting(true);
    setImportError("");

    try {
      const response =
        await fetch(
          "/api/admin/news/import-wechat",
          {
            method: "POST",
            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                url: urlText,
              }),
          },
        );

      const result =
        (await response.json()) as ApiResponse<ImportedWechatArticle>;

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        setImportError(
          result.error?.message ??
            "公众号文章解析失败",
        );

        return;
      }

      const imported =
        result.data;

      const sourcePublishedAt =
        toDateTimeLocal(
          imported.sourcePublishedAt,
        );

      setForm(
        (current) => ({
          ...current,

          title:
            imported.title ??
            "",

          summary:
            imported.summary ??
            "",

          authorName:
            imported.authorName ??
            "",

          coverImageAssetId:
            imported.coverImageAssetId ??
            imported
              .coverImageAsset
              ?.id ??
            null,

          coverImageAlt:
            imported.coverImageAlt ??
            imported.title ??
            "",

          content:
            imported.content,

          sourceType:
            "WECHAT",

          sourceUrl:
            imported.sourceUrl,

          sourceAccountName:
            imported.sourceAccountName ??
            "",

          sourceArticleId:
            imported.sourceArticleId ??
            "",

          sourcePublishedAt,

          publishedAt:
            current.publishedAt ||
            sourcePublishedAt,

          importMeta:
            imported.importMeta ??
            null,
        }),
      );

      setSelectedCover(
        imported.coverImageAsset ??
          null,
      );

      /*
       * 强制重新创建编辑器，
       * 确保导入的正文立即显示。
       */
      setEditorVersion(
        (value) => value + 1,
      );

      setWechatUrl(
        imported.sourceUrl,
      );
    } catch {
      setImportError(
        "公众号文章解析请求失败，请稍后重试",
      );
    } finally {
      setImporting(false);
    }
  }

  function clearWechatSource() {
    if (
      !window.confirm(
        "确认清除公众号来源信息吗？已经导入的标题和正文不会被删除。",
      )
    ) {
      return;
    }

    setForm(
      (current) => ({
        ...current,
        sourceType:
          "MANUAL",
        sourceUrl: "",
        sourceAccountName:
          "",
        sourceArticleId:
          "",
        sourcePublishedAt:
          "",
        importMeta: null,
      }),
    );

    setWechatUrl("");
  }

  function selectCover(
    asset: NewsMediaAsset,
  ) {
    setSelectedCover(asset);

    updateForm(
      "coverImageAssetId",
      asset.id,
    );

    if (
      !form.coverImageAlt.trim()
    ) {
      updateForm(
        "coverImageAlt",
        asset.alt ||
          form.title ||
          "",
      );
    }

    setCoverPickerOpen(false);
  }

  function removeCover() {
    setSelectedCover(null);

    updateForm(
      "coverImageAssetId",
      null,
    );
  }

  const isSaving =
    savingAction !== null;

  return (
    <>
      <div className="space-y-6">
        {mode === "create" && (
          <section className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">
            <div className="border-b border-emerald-200 px-5 py-4">
              <h2 className="font-semibold text-emerald-950">
                从微信公众号导入
              </h2>

              <p className="mt-1 text-sm text-emerald-800">
                粘贴微信公众号文章地址，系统会解析正文和图片并填充到新闻表单。解析完成后不会自动保存或发布。
              </p>
            </div>

            <div className="space-y-3 px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  type="url"
                  value={wechatUrl}
                  onChange={(
                    event,
                  ) => {
                    setWechatUrl(
                      event.target
                        .value,
                    );

                    setImportError(
                      "",
                    );
                  }}
                  placeholder="https://mp.weixin.qq.com/s/..."
                  className="min-w-0 flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <button
                  type="button"
                  disabled={
                    importing ||
                    isSaving
                  }
                  onClick={
                    importWechatArticle
                  }
                  className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importing
                    ? "正在解析..."
                    : "解析文章"}
                </button>
              </div>

              {importError && (
                <p className="text-sm text-red-600">
                  {importError}
                </p>
              )}
            </div>
          </section>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {form.sourceType ===
          "WECHAT" && (
          <section className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-950">
                  微信公众号来源
                </p>

                {form.sourceAccountName && (
                  <p className="mt-2 text-sm text-blue-800">
                    公众号：
                    {
                      form.sourceAccountName
                    }
                  </p>
                )}

                {form.sourcePublishedAt && (
                  <p className="mt-1 text-sm text-blue-800">
                    原文发布时间：
                    {
                      form.sourcePublishedAt
                    }
                  </p>
                )}

                {form.sourceUrl && (
                  <a
                    href={
                      form.sourceUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block truncate text-sm text-blue-700 underline"
                  >
                    {form.sourceUrl}
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={
                  clearWechatSource
                }
                className="shrink-0 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
              >
                清除来源信息
              </button>
            </div>
          </section>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              基本信息
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              新闻页面地址由系统根据首次创建时的标题自动生成，后续修改标题不会改变原地址。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="语言"
              required
              error={
                fieldErrors
                  .locale?.[0]
              }
            >
              <select
                value={
                  form.locale
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    "locale",
                    event.target
                      .value as NewsLocale,
                  )
                }
                className={inputClass(
                  Boolean(
                    fieldErrors
                      .locale,
                  ),
                )}
              >
                <option value="zh">
                  中文（zh）
                </option>

                <option value="en">
                  English（en）
                </option>
              </select>
            </Field>

            <Field
              label="作者"
              error={
                fieldErrors
                  .authorName?.[0]
              }
            >
              <input
                value={
                  form.authorName
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    "authorName",
                    event.target
                      .value,
                  )
                }
                placeholder="作者或编辑名称"
                className={inputClass(
                  Boolean(
                    fieldErrors
                      .authorName,
                  ),
                )}
              />
            </Field>

            <Field
              label="新闻标题"
              required
              error={
                fieldErrors
                  .title?.[0]
              }
              className="md:col-span-2"
            >
              <input
                value={
                  form.title
                }
                maxLength={200}
                onChange={(
                  event,
                ) =>
                  updateForm(
                    "title",
                    event.target
                      .value,
                  )
                }
                placeholder="请输入新闻标题"
                className={inputClass(
                  Boolean(
                    fieldErrors
                      .title,
                  ),
                )}
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {
                  form.title
                    .length
                }
                /200
              </p>
            </Field>

            <Field
              label="新闻摘要"
              error={
                fieldErrors
                  .summary?.[0]
              }
              className="md:col-span-2"
            >
              <textarea
                value={
                  form.summary
                }
                maxLength={1000}
                onChange={(
                  event,
                ) =>
                  updateForm(
                    "summary",
                    event.target
                      .value,
                  )
                }
                placeholder="用于新闻列表、搜索结果和 SEO 描述"
                className={`${inputClass(
                  Boolean(
                    fieldErrors
                      .summary,
                  ),
                )} min-h-28 resize-y`}
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {
                  form.summary
                    .length
                }
                /1000
              </p>
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              新闻封面
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              从本地素材库选择图片。公众号导入时，原文封面也会下载到素材库。
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
              {selectedCover?.url ? (
                <div className="relative aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      selectedCover.url
                    }
                    alt={
                      form.coverImageAlt ||
                      form.title ||
                      "新闻封面"
                    }
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-slate-400">
                  尚未选择新闻封面
                </div>
              )}
            </div>

            <div className="space-y-4">
              {selectedCover && (
                <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">
                    {selectedCover.originalName ||
                      selectedCover.filename ||
                      "已选择图片"}
                  </p>

                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {selectedCover.width &&
                      selectedCover.height && (
                        <span>
                          {
                            selectedCover.width
                          }
                          ×
                          {
                            selectedCover.height
                          }
                        </span>
                      )}

                    {selectedCover.size !==
                      undefined &&
                      selectedCover.size !==
                        null && (
                        <span>
                          {formatFileSize(
                            selectedCover.size,
                          )}
                        </span>
                      )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCoverPickerOpen(
                      true,
                    )
                  }
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  {selectedCover
                    ? "更换封面"
                    : "选择封面"}
                </button>

                {selectedCover && (
                  <button
                    type="button"
                    onClick={
                      removeCover
                    }
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    移除封面
                  </button>
                )}
              </div>

              <Field
                label="封面图片说明"
                error={
                  fieldErrors
                    .coverImageAlt?.[0]
                }
              >
                <input
                  value={
                    form.coverImageAlt
                  }
                  maxLength={200}
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      "coverImageAlt",
                      event.target
                        .value,
                    )
                  }
                  placeholder="用于 SEO 和无障碍访问"
                  className={inputClass(
                    Boolean(
                      fieldErrors
                        .coverImageAlt,
                    ),
                  )}
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                新闻正文
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                导入公众号文章后，正文仍可以继续编辑和排版。
              </p>
            </div>
          </div>

          <NewsEditor
            key={editorVersion}
            value={
              form.content
            }
            onChange={(
              content,
            ) =>
              updateForm(
                "content",
                content,
              )
            }
          />

          {fieldErrors
            .content?.[0] && (
            <p className="mt-2 text-sm text-red-600">
              {
                fieldErrors
                  .content[0]
              }
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              发布设置
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="发布时间"
              error={
                fieldErrors
                  .publishedAt?.[0]
              }
            >
              <input
                type="datetime-local"
                value={
                  form.publishedAt
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    "publishedAt",
                    event.target
                      .value,
                  )
                }
                className={inputClass(
                  Boolean(
                    fieldErrors
                      .publishedAt,
                  ),
                )}
              />

              <p className="mt-1 text-xs text-slate-500">
                发布时未填写，系统会使用当前时间。
              </p>
            </Field>

            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                当前状态
              </span>

              <div className="flex h-11 items-center">
                <span
                  className={
                    form.status ===
                    "PUBLISHED"
                      ? "rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700"
                      : "rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700"
                  }
                >
                  {form.status ===
                  "PUBLISHED"
                    ? "已发布"
                    : "草稿"}
                </span>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 md:col-span-2">
              <input
                type="checkbox"
                checked={
                  form.isFeatured
                }
                onChange={(
                  event,
                ) =>
                  updateForm(
                    "isFeatured",
                    event.target
                      .checked,
                  )
                }
                className="h-4 w-4"
              />

              <span>
                <span className="block text-sm font-medium text-slate-800">
                  推荐新闻
                </span>

                <span className="block text-xs text-slate-500">
                  推荐新闻可以在首页或新闻列表中优先展示。
                </span>
              </span>
            </label>
          </div>
        </section>

        <div className="sticky bottom-4 z-20 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="text-sm text-slate-500">
              {dirty
                ? "存在尚未保存的修改"
                : "当前内容已保存"}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={
                  isSaving ||
                  importing
                }
                onClick={() =>
                  router.push(
                    "/admin/news",
                  )
                }
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                返回列表
              </button>

              {mode === "edit" && (
                <button
                  type="button"
                  disabled={
                    isSaving ||
                    importing
                  }
                  onClick={() =>
                    submit(
                      "save",
                    )
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {savingAction ===
                  "save"
                    ? "保存中..."
                    : "保存修改"}
                </button>
              )}

              {(mode ===
                "create" ||
                form.status ===
                  "PUBLISHED") && (
                <button
                  type="button"
                  disabled={
                    isSaving ||
                    importing
                  }
                  onClick={() =>
                    submit(
                      "draft",
                    )
                  }
                  className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                >
                  {savingAction ===
                  "draft"
                    ? "保存中..."
                    : mode ===
                          "edit" &&
                        form.status ===
                          "PUBLISHED"
                      ? "转为草稿"
                      : "保存草稿"}
                </button>
              )}

              <button
                type="button"
                disabled={
                  isSaving ||
                  importing
                }
                onClick={() =>
                  submit(
                    "publish",
                  )
                }
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAction ===
                "publish"
                  ? "发布中..."
                  : form.status ===
                      "PUBLISHED"
                    ? "保存并发布"
                    : "发布新闻"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <NewsCoverPicker
        open={
          coverPickerOpen
        }
        selectedId={
          form.coverImageAssetId
        }
        onClose={() =>
          setCoverPickerOpen(
            false,
          )
        }
        onSelect={
          selectCover
        }
      />
    </>
  );
}

function NewsCoverPicker({
  open,
  selectedId,
  onClose,
  onSelect,
}: {
  open: boolean;
  selectedId:
    | string
    | null;
  onClose: () => void;
  onSelect: (
    asset: NewsMediaAsset,
  ) => void;
}) {
  const [
    assets,
    setAssets,
  ] = useState<
    NewsMediaAsset[]
  >([]);

  const [
    keyword,
    setKeyword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadAssets("");
  }, [open]);

  async function loadAssets(
    searchKeyword: string,
  ) {
    setLoading(true);
    setError("");

    try {
      const parameters =
        new URLSearchParams({
          type: "IMAGE",
          enabled: "true",
          deleted: "false",
          page: "1",
          pageSize: "60",
        });

      if (
        searchKeyword.trim()
      ) {
        parameters.set(
          "keyword",
          searchKeyword.trim(),
        );
      }

      const response =
        await fetch(
          `/api/admin/assets?${parameters.toString()}`,
          {
            credentials:
              "include",
          },
        );

      const result =
        (await response.json()) as ApiResponse<{
          items:
            NewsMediaAsset[];
        }>;

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.error?.message ??
            "素材加载失败",
        );

        return;
      }

      setAssets(
        result.data?.items ??
          [],
      );
    } catch {
      setError(
        "素材加载失败，请稍后重试",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              选择新闻封面
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              从本地图片素材库中选择一张图片。
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-lg px-3 py-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            关闭
          </button>
        </div>

        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex gap-3">
            <input
              value={
                keyword
              }
              onChange={(
                event,
              ) =>
                setKeyword(
                  event.target
                    .value,
                )
              }
              onKeyDown={(
                event,
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  void loadAssets(
                    keyword,
                  );
                }
              }}
              placeholder="搜索文件名或图片说明"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              disabled={
                loading
              }
              onClick={() =>
                void loadAssets(
                  keyword,
                )
              }
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              搜索
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
              正在加载素材...
            </div>
          ) : assets.length ===
            0 ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
              暂无可用图片素材
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {assets.map(
                (asset) => {
                  const selected =
                    asset.id ===
                    selectedId;

                  return (
                    <button
                      key={
                        asset.id
                      }
                      type="button"
                      onClick={() =>
                        onSelect(
                          asset,
                        )
                      }
                      className={`overflow-hidden rounded-xl border text-left transition ${
                        selected
                          ? "border-blue-500 ring-2 ring-blue-100"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <div className="aspect-video bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            asset.url
                          }
                          alt={
                            asset.alt ||
                            asset.originalName ||
                            asset.filename ||
                            "素材图片"
                          }
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="p-3">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {asset.originalName ||
                            asset.filename ||
                            "未命名图片"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {asset.width &&
                          asset.height
                            ? `${asset.width} × ${asset.height}`
                            : "图片素材"}
                        </p>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function inputClass(
  hasError: boolean,
) {
  return [
    "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition",
    "focus:ring-2",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100",
  ].join(" ");
}

function Field({
  label,
  required = false,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={
        className
      }
    >
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}

      {error && (
        <span className="mt-1 block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}