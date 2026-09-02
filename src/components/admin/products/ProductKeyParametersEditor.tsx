"use client";

import {
  ArrowDown,
  ArrowUp,
  ListChecks,
  Plus,
  Trash2,
  X,
} from "lucide-react";

export type ProductKeyParametersValue = {
  title: string;
  items: Array<{
    key: string;
    value: string;
  }>;
};

type ProductKeyParametersEditorProps = {
  value: ProductKeyParametersValue | null;
  onChange: (
    value: ProductKeyParametersValue | null,
  ) => void;
  maxItems?: number;
};

function createDefaultKeyParameters(): ProductKeyParametersValue {
  return {
    title: "主要技术参数",
    items: [],
  };
}

export default function ProductKeyParametersEditor({
  value,
  onChange,
  maxItems = 100,
}: ProductKeyParametersEditorProps) {
  function enableKeyParameters() {
    onChange(
      createDefaultKeyParameters(),
    );
  }

  function disableKeyParameters() {
    onChange(null);
  }

  function updateTitle(
    title: string,
  ) {
    if (!value) {
      return;
    }

    onChange({
      ...value,
      title,
    });
  }

  function addItem() {
    if (
      !value ||
      value.items.length >= maxItems
    ) {
      return;
    }

    onChange({
      ...value,

      items: [
        ...value.items,
        { key: "", value: "" },
      ],
    });
  }

  function removeItem(
    itemIndex: number,
  ) {
    if (!value) {
      return;
    }

    onChange({
      ...value,

      items: value.items.filter(
        (_item, index) =>
          index !== itemIndex,
      ),
    });
  }

  function updateItem(
    itemIndex: number,
    field: "key" | "value",
    fieldValue: string,
  ) {
    if (!value) {
      return;
    }

    onChange({
      ...value,

      items: value.items.map(
        (item, index) =>
          index === itemIndex
            ? {
                ...item,
                [field]: fieldValue,
              }
            : item,
      ),
    });
  }

  function moveItem(
    itemIndex: number,
    direction: -1 | 1,
  ) {
    if (!value) {
      return;
    }

    const nextIndex =
      itemIndex + direction;

    if (
      nextIndex < 0 ||
      nextIndex >= value.items.length
    ) {
      return;
    }

    const nextItems = [
      ...value.items,
    ];

    [
      nextItems[itemIndex],
      nextItems[nextIndex],
    ] = [
      nextItems[nextIndex],
      nextItems[itemIndex],
    ];

    onChange({
      ...value,
      items: nextItems,
    });
  }

  if (!value) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex min-h-48 flex-col items-center justify-center px-6 py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <ListChecks className="h-7 w-7" />
          </span>

          <h3 className="mt-4 text-sm font-semibold text-slate-800">
            暂未启用主要技术参数
          </h3>

          <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
            启用后可以设置标题，并逐项填写型号、型式等参数名称与取值，前台按
            key-value 列表样式展示。
          </p>

          <button
            type="button"
            onClick={
              enableKeyParameters
            }
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            启用主要技术参数
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-blue-600" />

            <h3 className="text-sm font-semibold text-slate-900">
              主要技术参数
            </h3>
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            配置前台产品详情页展示的
            key-value 参数列表，例如型号、型式、气缸数等。
          </p>
        </div>

        <button
          type="button"
          onClick={
            disableKeyParameters
          }
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-100"
        >
          <X className="h-3.5 w-3.5" />
          移除主要技术参数
        </button>
      </header>

      <div className="space-y-6 p-5">
        <div>
          <label
            htmlFor="keyParametersTitle"
            className="text-sm font-semibold text-slate-700"
          >
            模块标题
          </label>

          <input
            id="keyParametersTitle"
            value={value.title}
            maxLength={200}
            onChange={(event) =>
              updateTitle(
                event.target.value,
              )
            }
            placeholder="例如：主要技术参数"
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                参数列表
              </h4>

              <p className="mt-1 text-xs text-slate-500">
                当前共{" "}
                {value.items.length} 项，最多{" "}
                {maxItems} 项。
              </p>
            </div>

            <button
              type="button"
              onClick={addItem}
              disabled={
                value.items.length >=
                maxItems
              }
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              添加一项
            </button>
          </div>

          {value.items.length === 0 ? (
            <div className="mt-3 flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
              <p className="text-sm font-medium text-slate-500">
                暂无参数数据
              </p>

              <button
                type="button"
                onClick={addItem}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" />
                添加第一项
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {value.items.map(
                (item, itemIndex) => (
                  <article
                    key={`key-parameter-${itemIndex}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
                        {itemIndex + 1}
                      </span>

                      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">
                            参数名称
                          </label>

                          <input
                            value={
                              item.key
                            }
                            maxLength={100}
                            onChange={(
                              event,
                            ) =>
                              updateItem(
                                itemIndex,
                                "key",
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="例如：型号"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">
                            参数取值
                          </label>

                          <input
                            value={
                              item.value
                            }
                            maxLength={500}
                            onChange={(
                              event,
                            ) =>
                              updateItem(
                                itemIndex,
                                "value",
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="例如：L230/WT"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            moveItem(
                              itemIndex,
                              -1,
                            )
                          }
                          disabled={
                            itemIndex ===
                            0
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label={`上移第 ${
                            itemIndex + 1
                          } 项`}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            moveItem(
                              itemIndex,
                              1,
                            )
                          }
                          disabled={
                            itemIndex ===
                            value.items
                              .length -
                              1
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label={`下移第 ${
                            itemIndex + 1
                          } 项`}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(
                              itemIndex,
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-500 ring-1 ring-red-200 transition hover:bg-red-50 hover:text-red-700"
                          aria-label={`删除第 ${
                            itemIndex + 1
                          } 项`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
