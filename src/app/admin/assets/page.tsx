"use client";

import {
  FileText,
  ImageIcon,
  Images,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type MediaAssetType = "IMAGE" | "PDF";

type AssetItem = {
  id: string;
  type: MediaAssetType;
  url: string;
  relativePath: string;
  filename: string;
  originalName: string | null;
  mimeType: string;
  size: number;
  checksum: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;

  usage: {
    advantages: number;
    applications: number;
    productCovers: number;
    productIntroBackgrounds: number;
    productPdfs: number;
    newsCovers: number;
    solutionWorkingPrincipleBackgrounds: number;
    solutionUsageScenarios: number;
    solutionCustomerValues: number;
    total: number;
  };
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors: Record<string, string[]>;
  };
};

type AssetListResponse =
  | {
      success: true;
      data: {
        items: AssetItem[];
        pagination: Pagination;
      };
    }
  | ApiFailure;

type AssetUploadResponse =
  | {
      success: true;
      data: AssetItem;
    }
  | ApiFailure;

type AssetDeleteResponse =
  | {
      success: true;
      data: {
        id: string;
        deleted: boolean;
      };
    }
  | ApiFailure;

type AssetFilter = "ALL" | MediaAssetType;

function getErrorMessage(
  result:
    | AssetListResponse
    | AssetUploadResponse
    | AssetDeleteResponse,
): string {
  if (!result.success) {
    const firstFieldError = Object.values(
      result.error.fieldErrors,
    ).flat()[0];

    return firstFieldError || result.error.message;
  }

  return "请求失败，请稍后重试";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminAssetsPage() {
  const [items, setItems] = useState<
    AssetItem[]
  >([]);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [filter, setFilter] =
    useState<AssetFilter>("ALL");

  const [keywordInput, setKeywordInput] =
    useState("");

  const [keyword, setKeyword] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [pageError, setPageError] =
    useState("");

  const [isUploadOpen, setIsUploadOpen] =
    useState(false);

  const [uploadType, setUploadType] =
    useState<MediaAssetType>("IMAGE");

  const [uploadFile, setUploadFile] =
    useState<File | null>(null);

  const [uploadAlt, setUploadAlt] =
    useState("");

  const [uploadError, setUploadError] =
    useState("");

  const [isUploading, setIsUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const loadAssets = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setPageError("");

      try {
        const searchParams =
          new URLSearchParams({
            page: String(page),
            pageSize: "20",
          });

        if (filter !== "ALL") {
          searchParams.set("type", filter);
        }

        if (keyword.trim()) {
          searchParams.set(
            "keyword",
            keyword.trim(),
          );
        }

        const response = await fetch(
          `/api/admin/assets?${searchParams.toString()}`,
          {
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as AssetListResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            getErrorMessage(result),
          );
        }

        setItems(result.data.items);
        setPagination(
          result.data.pagination,
        );
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "素材库加载失败",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [filter, keyword],
  );

  useEffect(() => {
    void loadAssets(1);
  }, [loadAssets]);

  const statistics = useMemo(() => {
    const images = items.filter(
      (item) => item.type === "IMAGE",
    ).length;

    const pdfs = items.filter(
      (item) => item.type === "PDF",
    ).length;

    const inUse = items.filter(
      (item) => item.usage.total > 0,
    ).length;

    return {
      images,
      pdfs,
      inUse,
    };
  }, [items]);

  function openUpload(
    type: MediaAssetType,
  ) {
    setUploadType(type);
    setUploadFile(null);
    setUploadAlt("");
    setUploadError("");
    setIsUploadOpen(true);
  }

  function closeUpload(force = false) {
    if (isUploading && !force) {
      return;
    }

    setIsUploadOpen(false);
    setUploadFile(null);
    setUploadAlt("");
    setUploadError("");
  }

  async function handleUpload(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!uploadFile) {
      setUploadError("请选择需要上传的文件");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();

      formData.set("file", uploadFile);
      formData.set("type", uploadType);

      if (
        uploadType === "IMAGE" &&
        uploadAlt.trim()
      ) {
        formData.set(
          "alt",
          uploadAlt.trim(),
        );
      }

      const response = await fetch(
        "/api/admin/assets/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const result =
        (await response.json()) as AssetUploadResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(result),
        );
      }

      closeUpload(true);
      await loadAssets(1);
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "素材上传失败",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(
    asset: AssetItem,
  ) {
    const displayName =
      asset.originalName ||
      asset.filename;

    const confirmed = window.confirm(
      `确认删除素材“${displayName}”吗？\n\n正在被产品使用的素材无法删除。`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(asset.id);
    setPageError("");

    try {
      const response = await fetch(
        `/api/admin/assets/${asset.id}`,
        {
          method: "DELETE",
        },
      );

      const result =
        (await response.json()) as AssetDeleteResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(result),
        );
      }

      await loadAssets(
        pagination.page,
      );
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "素材删除失败",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleSearch(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setKeyword(keywordInput.trim());
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Images className="h-4 w-4" />
            产品内容管理
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            素材库
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            管理产品封面、产品优势、应用场景图片和产品详情 PDF。
            图片可以被不同产品重复使用，标题仍在产品中独立填写。
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              void loadAssets(
                pagination.page,
              )
            }
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={[
                "h-4 w-4",
                isLoading
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />
            刷新
          </button>

          <button
            type="button"
            onClick={() =>
              openUpload("PDF")
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
          >
            <FileText className="h-4 w-4" />
            上传 PDF
          </button>

          <button
            type="button"
            onClick={() =>
              openUpload("IMAGE")
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            上传图片
          </button>
        </div>
      </header>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="当前结果"
          value={pagination.total}
          description="符合当前搜索和筛选条件"
        />

        <StatCard
          label="本页图片"
          value={statistics.images}
          description="产品相关图片素材"
        />

        <StatCard
          label="本页 PDF"
          value={statistics.pdfs}
          description="产品详情下载文件"
        />

        <StatCard
          label="正在使用"
          value={statistics.inUse}
          description="当前页中被产品引用的素材"
        />
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              {
                value: "ALL",
                label: "全部素材",
              },
              {
                value: "IMAGE",
                label: "图片",
              },
              {
                value: "PDF",
                label: "PDF",
              },
            ].map((item) => {
              const active =
                filter === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setFilter(
                      item.value as AssetFilter,
                    )
                  }
                  className={[
                    "rounded-lg px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={handleSearch}
            className="flex gap-2"
          >
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={keywordInput}
                onChange={(event) =>
                  setKeywordInput(
                    event.target.value,
                  )
                }
                placeholder="搜索文件名或替代文本"
                className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-72"
              />
            </label>

            <button
              type="submit"
              className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              搜索
            </button>
          </form>
        </div>

        {pageError ? (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-96 items-center justify-center">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              正在加载素材库
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-96 flex-col items-center justify-center px-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Images className="h-8 w-8" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-800">
              暂无符合条件的素材
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              可以上传新图片或 PDF 文件。
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {items.map((asset) => (
                <article
                  key={asset.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-lg"
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-100">
                    {asset.type ===
                    "IMAGE" ? (
                      <Image
                        src={asset.url}
                        alt={
                          asset.alt ||
                          asset.originalName ||
                          "产品图片素材"
                        }
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        className="object-contain p-4"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-violet-600">
                        <FileText className="h-16 w-16" />

                        <span className="mt-3 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold">
                          PDF
                        </span>
                      </div>
                    )}

                    <span
                      className={[
                        "absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm",
                        asset.type ===
                        "IMAGE"
                          ? "bg-blue-600 text-white"
                          : "bg-violet-600 text-white",
                      ].join(" ")}
                    >
                      {asset.type ===
                      "IMAGE"
                        ? "图片"
                        : "PDF"}
                    </span>
                  </div>

                  <div className="p-4">
                    <h2
                      className="truncate text-sm font-semibold text-slate-900"
                      title={
                        asset.originalName ||
                        asset.filename
                      }
                    >
                      {asset.originalName ||
                        asset.filename}
                    </h2>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                      <p>
                        大小：
                        {formatFileSize(
                          asset.size,
                        )}
                      </p>

                      {asset.type ===
                      "IMAGE" ? (
                        <p>
                          尺寸：
                          {asset.width &&
                          asset.height
                            ? `${asset.width} × ${asset.height}`
                            : "未知"}
                        </p>
                      ) : null}

                      <p>
                        上传：
                        {formatDate(
                          asset.createdAt,
                        )}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          asset.usage.total > 0
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700",
                        ].join(" ")}
                      >
                        {asset.usage.total > 0
                          ? `使用 ${asset.usage.total} 次`
                          : "未使用"}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(
                            asset,
                          )
                        }
                        disabled={
                          deletingId ===
                          asset.id
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label="删除素材"
                      >
                        {deletingId ===
                        asset.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                第 {pagination.page} 页，共{" "}
                {Math.max(
                  pagination.totalPages,
                  1,
                )}{" "}
                页，合计 {pagination.total} 个素材
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    void loadAssets(
                      pagination.page - 1,
                    )
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  上一页
                </button>

                <button
                  type="button"
                  disabled={
                    !pagination.hasNextPage
                  }
                  onClick={() =>
                    void loadAssets(
                      pagination.page + 1,
                    )
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {isUploadOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="关闭上传窗口"
            onClick={() => closeUpload()}
            className="absolute inset-0"
          />

          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Media Upload
                </p>

                <h2 className="mt-2 text-xl font-bold text-slate-950">
                  {uploadType ===
                  "IMAGE"
                    ? "上传产品图片"
                    : "上传产品 PDF"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => closeUpload()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <div className="space-y-5 px-6 py-6">
                {uploadError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {uploadError}
                  </div>
                ) : null}

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    文件类型
                  </label>

                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadType(
                          "IMAGE",
                        );
                        setUploadFile(null);
                      }}
                      className={[
                        "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition",
                        uploadType ===
                        "IMAGE"
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <ImageIcon className="h-4 w-4" />
                      图片
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUploadType(
                          "PDF",
                        );
                        setUploadFile(null);
                      }}
                      className={[
                        "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition",
                        uploadType ===
                        "PDF"
                          ? "border-violet-600 bg-violet-50 text-violet-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <FileText className="h-4 w-4" />
                      PDF
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="assetFile"
                    className="text-sm font-semibold text-slate-700"
                  >
                    选择文件
                  </label>

                  <label
                    htmlFor="assetFile"
                    className="mt-2 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 text-center transition hover:border-blue-400 hover:bg-blue-50"
                  >
                    <Upload className="h-8 w-8 text-slate-400" />

                    <span className="mt-3 text-sm font-semibold text-slate-700">
                      {uploadFile
                        ? uploadFile.name
                        : "点击选择文件"}
                    </span>

                    <span className="mt-1 text-xs text-slate-400">
                      {uploadType ===
                      "IMAGE"
                        ? "支持 JPG、PNG、WebP 和 GIF，最大 10 MB"
                        : "仅支持 PDF，最大 50 MB"}
                    </span>
                  </label>

                  <input
                    id="assetFile"
                    type="file"
                    required
                    accept={
                      uploadType ===
                      "IMAGE"
                        ? "image/jpeg,image/png,image/webp,image/gif"
                        : "application/pdf"
                    }
                    onChange={(event) =>
                      setUploadFile(
                        event.target
                          .files?.[0] ??
                          null,
                      )
                    }
                    className="sr-only"
                  />
                </div>

                {uploadType ===
                "IMAGE" ? (
                  <div>
                    <label
                      htmlFor="uploadAlt"
                      className="text-sm font-semibold text-slate-700"
                    >
                      图片替代文本
                    </label>

                    <input
                      id="uploadAlt"
                      value={uploadAlt}
                      maxLength={200}
                      onChange={(event) =>
                        setUploadAlt(
                          event.target.value,
                        )
                      }
                      placeholder="用于无障碍访问和 SEO，可选"
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => closeUpload()}
                  disabled={isUploading}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  取消
                </button>

                <button
                  type="submit"
                  disabled={
                    isUploading ||
                    !uploadFile
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}

                  {isUploading
                    ? "正在上传..."
                    : "开始上传"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}
