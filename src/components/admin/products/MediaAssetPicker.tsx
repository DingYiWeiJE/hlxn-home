"use client";

import {
  Check,
  FileText,
  ImageIcon,
  Loader2,
  Search,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { isQiniuUrl } from "@/lib/config";

export type ProductMediaPurpose =
  | "GENERAL"
  | "PRODUCT_COVER"
  | "PRODUCT_INTRO_BACKGROUND"
  | "PRODUCT_ADVANTAGE"
  | "PRODUCT_APPLICATION"
  | "SOLUTION_WORKING_PRINCIPLE_BACKGROUND"
  | "SOLUTION_USAGE_SCENARIO"
  | "SOLUTION_CUSTOMER_VALUE";

export type ProductMediaAsset = {
  id: string;
  type: "IMAGE" | "PDF";
  purpose: ProductMediaPurpose;

  url: string;
  filename: string;
  originalName: string | null;
  mimeType: string;
  size: number;

  width: number | null;
  height: number | null;
  alt: string | null;

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
    fieldErrors?: Record<
      string,
      string[]
    >;
  };
};

type AssetListResponse =
  | {
      success: true;
      data: {
        items: ProductMediaAsset[];
        pagination: Pagination;
      };
    }
  | ApiFailure;

type UploadedAsset = Omit<
  ProductMediaAsset,
  "usage" | "purpose"
> & {
  purpose?: ProductMediaPurpose;
  usage?: ProductMediaAsset["usage"];
};

type AssetUploadResponse =
  | {
      success: true;
      data: UploadedAsset;
    }
  | ApiFailure;

type MediaAssetPickerProps = {
  open: boolean;
  type: "IMAGE" | "PDF";
  title: string;

  /**
   * 图片业务用途。
   * PDF 会自动使用 GENERAL。
   */
  purpose?: ProductMediaPurpose;

  selectedAssetId?: string | null;

  /**
   * 当前页面是否允许直接上传。
   */
  allowUpload?: boolean;

  /**
   * 上传图片时使用的替代文本。
   */
  uploadAlt?: string;

  onSelect: (
    asset: ProductMediaAsset,
  ) => void;

  onClose: () => void;
};

const emptyUsage: ProductMediaAsset["usage"] =
  {
    advantages: 0,
    applications: 0,
    productCovers: 0,
    productIntroBackgrounds: 0,
    productPdfs: 0,
    newsCovers: 0,
    solutionWorkingPrincipleBackgrounds: 0,
    solutionUsageScenarios: 0,
    solutionCustomerValues: 0,
    total: 0,
  };

function getErrorMessage(
  result:
    | AssetListResponse
    | AssetUploadResponse,
): string {
  if (!result.success) {
    const firstFieldError =
      Object.values(
        result.error.fieldErrors ??
          {},
      ).flat()[0];

    return (
      firstFieldError ||
      result.error.message
    );
  }

  return "请求失败";
}

function formatFileSize(
  bytes: number,
): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

export default function MediaAssetPicker({
  open,
  type,
  title,
  purpose = "GENERAL",
  selectedAssetId,
  allowUpload = true,
  uploadAlt,
  onSelect,
  onClose,
}: MediaAssetPickerProps) {
  const effectivePurpose:
    ProductMediaPurpose =
    type === "PDF"
      ? "GENERAL"
      : purpose;

  const [items, setItems] =
    useState<ProductMediaAsset[]>(
      [],
    );

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      pageSize: 12,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [
    keywordInput,
    setKeywordInput,
  ] = useState("");

  const [keyword, setKeyword] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const loadAssets = useCallback(
    async (page = 1) => {
      if (!open) {
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const searchParams =
          new URLSearchParams({
            type,
            page: String(page),
            pageSize: "12",
          });

        /*
         * PDF 不使用图片用途筛选。
         * 图片按照明确的产品用途查询。
         */
        if (type === "IMAGE") {
          searchParams.set(
            "purpose",
            effectivePurpose,
          );
        }

        if (keyword.trim()) {
          searchParams.set(
            "keyword",
            keyword.trim(),
          );
        }

        const response =
          await fetch(
            `/api/admin/assets?${searchParams.toString()}`,
            {
              cache: "no-store",
              credentials:
                "include",
            },
          );

        const result =
          (await response.json()) as AssetListResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            getErrorMessage(result),
          );
        }

        setItems(
          result.data.items,
        );

        setPagination(
          result.data.pagination,
        );
      } catch (loadError) {
        setItems([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "素材加载失败",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      effectivePurpose,
      keyword,
      open,
      type,
    ],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setKeywordInput("");
    setKeyword("");
    setError("");
  }, [
    effectivePurpose,
    open,
    type,
  ]);

  useEffect(() => {
    void loadAssets(1);
  }, [loadAssets]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === "Escape" &&
        !isUploading
      ) {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    isUploading,
    onClose,
    open,
  ]);

  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setKeyword(
      keywordInput.trim(),
    );
  }

  function handleSelect(
    asset: ProductMediaAsset,
  ) {
    onSelect(asset);
    onClose();
  }

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.target;
    const file =
      input.files?.[0];

    input.value = "";

    if (!file) {
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      formData.append(
        "type",
        type,
      );

      formData.append(
        "purpose",
        effectivePurpose,
      );

      if (
        type === "IMAGE" &&
        uploadAlt?.trim()
      ) {
        formData.append(
          "alt",
          uploadAlt.trim(),
        );
      }

      const response =
        await fetch(
          "/api/admin/assets/upload",
          {
            method: "POST",
            credentials:
              "include",
            body: formData,
          },
        );

      const result =
        (await response.json()) as AssetUploadResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          getErrorMessage(result),
        );
      }

      const uploadedAsset:
        ProductMediaAsset = {
        ...result.data,

        purpose:
          result.data.purpose ??
          effectivePurpose,

        usage:
          result.data.usage ??
          emptyUsage,
      };

      /*
       * 上传完成后直接使用当前素材，
       * 无需再次手动从列表中选择。
       */
      onSelect(uploadedAsset);
      onClose();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "素材上传失败",
      );
    } finally {
      setIsUploading(false);
    }
  }

  if (!open) {
    return null;
  }

  const accept =
    type === "IMAGE"
      ? "image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
      : "application/pdf";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="关闭素材选择器"
        onClick={() => {
          if (!isUploading) {
            onClose();
          }
        }}
        className="absolute inset-0"
      />

      <section className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Media Library
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-950">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {type === "IMAGE"
                ? "上传新图片，或从当前用途的素材中选择。"
                : "上传新 PDF，或从已有 PDF 中选择。"}
            </p>
          </div>

          <button
            type="button"
            disabled={isUploading}
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="shrink-0 border-b border-slate-200 p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            {allowUpload ? (
              <label
                className={[
                  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition",
                  isUploading
                    ? "cursor-not-allowed bg-blue-400"
                    : "cursor-pointer bg-blue-600 hover:bg-blue-700",
                ].join(" ")}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}

                {isUploading
                  ? "正在上传..."
                  : type === "IMAGE"
                    ? "上传新图片"
                    : "上传新 PDF"}

                <input
                  type="file"
                  accept={accept}
                  disabled={isUploading}
                  onChange={
                    handleUpload
                  }
                  className="hidden"
                />
              </label>
            ) : null}

            <form
              onSubmit={handleSearch}
              className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row"
            >
              <label className="relative block min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={
                    keywordInput
                  }
                  onChange={(event) =>
                    setKeywordInput(
                      event.target
                        .value,
                    )
                  }
                  placeholder={
                    type ===
                    "IMAGE"
                      ? "搜索当前分类中的图片"
                      : "搜索 PDF 文件名"
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <button
                type="submit"
                disabled={
                  isUploading
                }
                className="h-11 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                搜索
              </button>

              {keyword ? (
                <button
                  type="button"
                  disabled={
                    isUploading
                  }
                  onClick={() => {
                    setKeywordInput(
                      "",
                    );
                    setKeyword("");
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  清除
                </button>
              ) : null}
            </form>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error ? (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                正在加载素材
              </div>
            </div>
          ) : items.length ===
            0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                {type ===
                "IMAGE" ? (
                  <ImageIcon className="h-8 w-8" />
                ) : (
                  <FileText className="h-8 w-8" />
                )}
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-800">
                暂无可选择的素材
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                可以直接点击上方上传按钮添加新素材。
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(
                (asset) => {
                  const selected =
                    asset.id ===
                    selectedAssetId;

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      disabled={
                        isUploading
                      }
                      onClick={() =>
                        handleSelect(
                          asset,
                        )
                      }
                      className={[
                        "group overflow-hidden rounded-2xl border bg-white text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                        selected
                          ? "border-blue-600 ring-4 ring-blue-100"
                          : "border-slate-200 hover:border-blue-300 hover:shadow-lg",
                      ].join(" ")}
                    >
                      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-100">
                        {asset.type ===
                        "IMAGE" ? (
                          <Image
                            src={
                              asset.url
                            }
                            alt={
                              asset.alt ||
                              asset.originalName ||
                              "产品素材"
                            }
                            fill
                            unoptimized={isQiniuUrl(asset.url)}
                            sizes="(max-width: 640px) 100vw, 25vw"
                            className="object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-violet-600">
                            <FileText className="h-14 w-14" />

                            <span className="mt-3 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold">
                              PDF
                            </span>
                          </div>
                        )}

                        {selected ? (
                          <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : null}
                      </div>

                      <div className="p-4">
                        <h3
                          title={
                            asset.originalName ||
                            asset.filename
                          }
                          className="truncate text-sm font-semibold text-slate-900"
                        >
                          {asset.originalName ||
                            asset.filename}
                        </h3>

                        <div className="mt-2 space-y-1 text-xs text-slate-500">
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
                            已被使用：
                            {
                              asset
                                .usage
                                .total
                            }{" "}
                            次
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            第 {pagination.page} 页，共{" "}
            {Math.max(
              pagination.totalPages,
              1,
            )}{" "}
            页，合计{" "}
            {pagination.total} 个素材
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={
                !pagination.hasPreviousPage ||
                isLoading ||
                isUploading
              }
              onClick={() =>
                void loadAssets(
                  pagination.page -
                    1,
                )
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              上一页
            </button>

            <button
              type="button"
              disabled={
                !pagination.hasNextPage ||
                isLoading ||
                isUploading
              }
              onClick={() =>
                void loadAssets(
                  pagination.page +
                    1,
                )
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
