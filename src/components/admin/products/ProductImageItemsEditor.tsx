"use client";

import {
  ArrowDown,
  ArrowUp,
  ImageIcon,
  Images,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import MediaAssetPicker, {
  type ProductMediaAsset,
  type ProductMediaPurpose,
} from "@/components/admin/products/MediaAssetPicker";

export type ProductImageAsset = {
  id: string;
  url: string;
  filename?: string | null;
  originalName?: string | null;
  mimeType?: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
};

export type ProductImageListItem = {
  /**
   * 仅供前端列表稳定渲染使用，不提交到后端。
   */
  clientId: string;

  /**
   * 提交给后端的素材 ID。
   */
  assetId: string;

  /**
   * 当前产品中独立填写的标题。
   */
  title: string;

  /**
   * 显示顺序。
   */
  sortOrder: number;

  /**
   * 用于后台预览的素材信息。
   */
  asset: ProductImageAsset | null;
};

type ProductImagePurpose =
  | "PRODUCT_ADVANTAGE"
  | "PRODUCT_APPLICATION";

type ProductImageItemsEditorProps = {
  label: string;
  description?: string;

  /**
   * 用于隔离素材：
   * 产品优势只能看到 PRODUCT_ADVANTAGE；
   * 应用场景只能看到 PRODUCT_APPLICATION。
   */
  purpose: ProductImagePurpose;

  items: ProductImageListItem[];

  onChange: (
    items: ProductImageListItem[],
  ) => void;

  addButtonText?: string;
  titlePlaceholder?: string;
  emptyText?: string;
  maxItems?: number;
  required?: boolean;
};

function createClientId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function normalizeSortOrder(
  items: ProductImageListItem[],
): ProductImageListItem[] {
  return items.map(
    (item, index) => ({
      ...item,
      sortOrder: index,
    }),
  );
}

function formatFileSize(
  bytes?: number,
): string | null {
  if (
    bytes === undefined ||
    !Number.isFinite(bytes)
  ) {
    return null;
  }

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

export default function ProductImageItemsEditor({
  label,
  description,
  purpose,
  items,
  onChange,
  addButtonText = "添加一项",
  titlePlaceholder = "请输入标题",
  emptyText = "暂未添加内容",
  maxItems = 30,
  required = false,
}: ProductImageItemsEditorProps) {
  const [
    pickerItemIndex,
    setPickerItemIndex,
  ] = useState<number | null>(
    null,
  );

  function addItem() {
    if (items.length >= maxItems) {
      return;
    }

    const nextIndex =
      items.length;

    onChange([
      ...items,
      {
        clientId:
          createClientId(),
        assetId: "",
        title: "",
        sortOrder:
          nextIndex,
        asset: null,
      },
    ]);

    /*
     * 新增项目后直接打开素材弹窗。
     * 用户可以选择已有图片，也可以直接上传新图片。
     */
    setPickerItemIndex(
      nextIndex,
    );
  }

  function removeItem(
    index: number,
  ) {
    const nextItems =
      items.filter(
        (_item, itemIndex) =>
          itemIndex !== index,
      );

    onChange(
      normalizeSortOrder(
        nextItems,
      ),
    );

    if (
      pickerItemIndex ===
      index
    ) {
      setPickerItemIndex(
        null,
      );
    }
  }

  function updateTitle(
    index: number,
    title: string,
  ) {
    onChange(
      items.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                title,
              }
            : item,
      ),
    );
  }

  function selectAsset(
    index: number,
    asset: ProductMediaAsset,
  ) {
    onChange(
      items.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                assetId:
                  asset.id,

                asset: {
                  id: asset.id,
                  url:
                    asset.url,
                  filename:
                    asset.filename,
                  originalName:
                    asset.originalName,
                  mimeType:
                    asset.mimeType,
                  size:
                    asset.size,
                  width:
                    asset.width,
                  height:
                    asset.height,
                  alt:
                    asset.alt,
                },
              }
            : item,
      ),
    );
  }

  function moveItem(
    index: number,
    direction: -1 | 1,
  ) {
    const nextIndex =
      index + direction;

    if (
      nextIndex < 0 ||
      nextIndex >=
        items.length
    ) {
      return;
    }

    const nextItems = [
      ...items,
    ];

    [
      nextItems[index],
      nextItems[nextIndex],
    ] = [
      nextItems[nextIndex],
      nextItems[index],
    ];

    onChange(
      normalizeSortOrder(
        nextItems,
      ),
    );
  }

  const selectedPickerItem =
    pickerItemIndex !== null
      ? items[
          pickerItemIndex
        ]
      : null;

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-slate-900">
                {label}
              </h3>

              {required ? (
                <span className="text-sm font-semibold text-red-500">
                  *
                </span>
              ) : null}
            </div>

            {description ? (
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={addItem}
            disabled={
              items.length >=
              maxItems
            }
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            {addButtonText}
          </button>
        </header>

        <div className="space-y-4 p-5">
          {items.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                <Images className="h-7 w-7" />
              </span>

              <h4 className="mt-4 text-sm font-semibold text-slate-700">
                {emptyText}
              </h4>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                可以选择已有图片，也可以在当前页面直接上传新图片。
              </p>

              <button
                type="button"
                onClick={addItem}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" />
                {addButtonText}
              </button>
            </div>
          ) : (
            items.map(
              (
                item,
                index,
              ) => {
                const fileSize =
                  formatFileSize(
                    item.asset
                      ?.size,
                  );

                return (
                  <article
                    key={
                      item.clientId
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row">
                      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white lg:w-56">
                        {item.asset ? (
                          <Image
                            src={'http://img.aact.pw/test.svg'}
                            alt={
                              item
                                .asset
                                .alt ||
                              item.title ||
                              `${label}图片`
                            }
                            fill
                            unoptimized={item.asset.url?.includes('img.aact.pw')}
                            sizes="224px"
                            className="object-contain p-3"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center px-4 text-center text-slate-400">
                            <ImageIcon className="h-8 w-8" />

                            <span className="mt-2 text-xs font-medium">
                              尚未选择图片
                            </span>
                          </div>
                        )}

                        <span className="absolute left-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-950 px-2 text-xs font-bold text-white shadow">
                          {index + 1}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div>
                          <label
                            htmlFor={`${item.clientId}-title`}
                            className="text-sm font-semibold text-slate-700"
                          >
                            标题
                          </label>

                          <input
                            id={`${item.clientId}-title`}
                            value={
                              item.title
                            }
                            required={
                              required
                            }
                            maxLength={
                              200
                            }
                            onChange={(
                              event,
                            ) =>
                              updateTitle(
                                index,
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder={
                              titlePlaceholder
                            }
                            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />

                          <div className="mt-1 flex justify-end">
                            <span className="text-xs tabular-nums text-slate-400">
                              {
                                item
                                  .title
                                  .length
                              }{" "}
                              / 200
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                图片素材
                              </p>

                              <p
                                className={[
                                  "mt-1 truncate text-sm font-medium",
                                  item.asset
                                    ? "text-slate-800"
                                    : "text-red-600",
                                ].join(
                                  " ",
                                )}
                              >
                                {item.asset
                                  ? item
                                      .asset
                                      .originalName ||
                                    item
                                      .asset
                                      .filename ||
                                    "已选择图片"
                                  : "必须选择一张图片"}
                              </p>

                              {item.asset ? (
                                <p className="mt-1 text-xs text-slate-400">
                                  {item
                                    .asset
                                    .width &&
                                  item
                                    .asset
                                    .height
                                    ? `${item.asset.width} × ${item.asset.height}`
                                    : "尺寸未知"}

                                  {fileSize
                                    ? ` · ${fileSize}`
                                    : ""}
                                </p>
                              ) : null}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setPickerItemIndex(
                                  index,
                                )
                              }
                              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                              <Images className="h-4 w-4" />

                              {item.asset
                                ? "更换或上传图片"
                                : "选择或上传图片"}
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                moveItem(
                                  index,
                                  -1,
                                )
                              }
                              disabled={
                                index ===
                                0
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label={`上移第 ${
                                index + 1
                              } 项`}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                moveItem(
                                  index,
                                  1,
                                )
                              }
                              disabled={
                                index ===
                                items.length -
                                  1
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label={`下移第 ${
                                index + 1
                              } 项`}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  index,
                                )
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50 hover:text-red-700"
                              aria-label={`删除第 ${
                                index + 1
                              } 项`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              },
            )
          )}

          {items.length > 0 ? (
            <footer className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                已添加{" "}
                {items.length} 项，最多{" "}
                {maxItems} 项
              </p>

              <button
                type="button"
                onClick={addItem}
                disabled={
                  items.length >=
                  maxItems
                }
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                {addButtonText}
              </button>
            </footer>
          ) : null}
        </div>
      </section>

      <MediaAssetPicker
        open={
          pickerItemIndex !==
          null
        }
        type="IMAGE"
        purpose={
          purpose as ProductMediaPurpose
        }
        title={`选择或上传${label}图片`}
        selectedAssetId={
          selectedPickerItem
            ?.assetId
        }
        uploadAlt={
          selectedPickerItem
            ?.title ||
          label
        }
        onSelect={(asset) => {
          if (
            pickerItemIndex ===
            null
          ) {
            return;
          }

          selectAsset(
            pickerItemIndex,
            asset,
          );
        }}
        onClose={() =>
          setPickerItemIndex(
            null,
          )
        }
      />
    </>
  );
}