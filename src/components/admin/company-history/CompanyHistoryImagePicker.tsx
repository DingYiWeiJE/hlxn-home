"use client";

import { Check, ImageIcon, Loader2, Search, Upload, X } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, type KeyboardEvent, useCallback, useEffect, useState } from "react";
import { isQiniuUrl } from "@/lib/config";
import { uploadAssetDirect } from "@/lib/qiniu/upload-client";

type Asset = {
  id: string;
  type: "IMAGE" | "PDF";
  url: string;
  filename: string;
  originalName: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
};

type Props = {
  selected: {
    id: string;
    url: string;
    width: number | null;
    height: number | null;
    alt: string | null;
  } | null;
  onChange: (asset: Props["selected"]) => void;
  disabled?: boolean;
  error?: string;
};

type ApiFailure = {
  success: false;
  error: {
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};

type ListResponse =
  | {
      success: true;
      data: {
        items: Asset[];
      };
    }
  | ApiFailure;

type UploadResponse =
  | {
      success: true;
      data: Asset;
    }
  | ApiFailure;

function getError(result: ListResponse | UploadResponse): string {
  if (result.success) {
    return "请求失败";
  }

  return Object.values(result.error.fieldErrors ?? {}).flat()[0] ?? result.error.message;
}

export default function CompanyHistoryImagePicker({
  selected,
  onChange,
  disabled = false,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Asset[]>([]);
  const [keyword, setKeyword] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const loadAssets = useCallback(async () => {
    if (!open) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams({
        type: "IMAGE",
        purpose: "COMPANY_HISTORY_IMAGE",
        page: "1",
        pageSize: "24",
      });

      if (keyword) {
        params.set("keyword", keyword);
      }

      const response = await fetch(`/api/admin/assets?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const result = (await response.json()) as ListResponse;

      if (!response.ok || !result.success) {
        throw new Error(getError(result));
      }

      setItems(result.data.items);
    } catch (loadError) {
      setItems([]);
      setMessage(loadError instanceof Error ? loadError.message : "素材加载失败");
    } finally {
      setLoading(false);
    }
  }, [keyword, open]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  function runSearch() {
    setKeyword(keywordInput.trim());
  }

  function handleKeywordKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";

    if (!file) {
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const asset = await uploadAssetDirect(file, {
        type: "IMAGE",
        purpose: "COMPANY_HISTORY_IMAGE",
      });

      onChange({
        id: asset.id,
        url: asset.url,
        width: asset.width,
        height: asset.height,
        alt: asset.alt,
      });
      setOpen(false);
    } catch (uploadError) {
      setMessage(uploadError instanceof Error ? uploadError.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">事件图片</h2>
          <p className="mt-1 text-xs text-slate-500">
            可上传新图片，或选择历史公司发展历程图片。
          </p>
        </div>
        {selected ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(null)}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            <X className="h-3.5 w-3.5" />
            移除
          </button>
        ) : null}
      </div>

      {selected ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <div className="relative aspect-[4/3]">
            <Image
              src={selected.url}
              alt={selected.alt || "公司发展历程图片预览"}
              fill
              sizes="(max-width: 768px) 100vw, 360px"
              className="object-cover"
              unoptimized={isQiniuUrl(selected.url)}
            />
          </div>
        </div>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
          <ImageIcon className="h-10 w-10" />
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40"
      >
        <ImageIcon className="h-4 w-4" />
        上传或选择图片
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
          <button
            type="button"
            aria-label="关闭素材选择器"
            className="absolute inset-0"
            onClick={() => {
              if (!uploading) {
                setOpen(false);
              }
            }}
          />

          <section className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-950">
                  公司发展历程图片
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  这里只显示用途为公司发展历程的图片素材。
                </p>
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "正在上传" : "上传新图片"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={uploading}
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex min-w-0 flex-1 gap-3">
                  <label className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={keywordInput}
                      onChange={(event) => setKeywordInput(event.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                      className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      placeholder="搜索文件名或替代文本"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={runSearch}
                    className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white"
                  >
                    搜索
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {message ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {message}
                </div>
              ) : null}

              {loading ? (
                <div className="flex min-h-72 items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  正在加载素材
                </div>
              ) : items.length === 0 ? (
                <div className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                  暂无可选的公司发展历程图片
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {items.map((asset) => {
                    const isSelected = selected?.id === asset.id;
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        disabled={uploading}
                        onClick={() => {
                          onChange({
                            id: asset.id,
                            url: asset.url,
                            width: asset.width,
                            height: asset.height,
                            alt: asset.alt,
                          });
                          setOpen(false);
                        }}
                        className={[
                          "overflow-hidden rounded-xl border bg-white text-left transition hover:shadow-lg disabled:opacity-50",
                          isSelected
                            ? "border-blue-600 ring-4 ring-blue-100"
                            : "border-slate-200 hover:border-blue-300",
                        ].join(" ")}
                      >
                        <div className="relative aspect-[4/3] bg-slate-100">
                          <Image
                            src={asset.url}
                            alt={asset.alt || asset.originalName || asset.filename}
                            fill
                            sizes="(max-width: 768px) 50vw, 240px"
                            className="object-cover"
                            unoptimized={isQiniuUrl(asset.url)}
                          />
                          {isSelected ? (
                            <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : null}
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {asset.originalName || asset.filename}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
