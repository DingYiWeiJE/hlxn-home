"use client";

import {
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
} from "lucide-react";

type DynamicTextListProps = {
  label: string;
  description?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  addButtonText?: string;
  multiline?: boolean;
  required?: boolean;
  maxItems?: number;
  maxLength?: number;
  emptyText?: string;
};

export default function DynamicTextList({
  label,
  description,
  values,
  onChange,
  placeholder = "请输入内容",
  addButtonText = "添加一项",
  multiline = false,
  required = false,
  maxItems = 50,
  maxLength = 2000,
  emptyText = "暂未添加内容",
}: DynamicTextListProps) {
  function updateValue(
    index: number,
    value: string,
  ) {
    onChange(
      values.map((item, itemIndex) =>
        itemIndex === index
          ? value
          : item,
      ),
    );
  }

  function addValue() {
    if (values.length >= maxItems) {
      return;
    }

    onChange([...values, ""]);
  }

  function removeValue(index: number) {
    onChange(
      values.filter(
        (_item, itemIndex) =>
          itemIndex !== index,
      ),
    );
  }

  function moveValue(
    index: number,
    direction: -1 | 1,
  ) {
    const nextIndex =
      index + direction;

    if (
      nextIndex < 0 ||
      nextIndex >= values.length
    ) {
      return;
    }

    const nextValues = [...values];

    [
      nextValues[index],
      nextValues[nextIndex],
    ] = [
      nextValues[nextIndex],
      nextValues[index],
    ];

    onChange(nextValues);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-1">
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
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={addValue}
          disabled={
            values.length >= maxItems
          }
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          {addButtonText}
        </button>
      </div>

      <div className="space-y-3 p-5">
        {values.length === 0 ? (
          <div className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
            <p className="text-sm font-medium text-slate-500">
              {emptyText}
            </p>

            <button
              type="button"
              onClick={addValue}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              {addButtonText}
            </button>
          </div>
        ) : (
          values.map((value, index) => (
            <div
              key={`${label}-${index}`}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold tabular-nums text-slate-500 shadow-sm ring-1 ring-slate-200">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  {multiline ? (
                    <textarea
                      value={value}
                      required={required}
                      maxLength={maxLength}
                      rows={4}
                      onChange={(event) =>
                        updateValue(
                          index,
                          event.target.value,
                        )
                      }
                      placeholder={placeholder}
                      className="min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      required={required}
                      maxLength={maxLength}
                      onChange={(event) =>
                        updateValue(
                          index,
                          event.target.value,
                        )
                      }
                      placeholder={placeholder}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  )}

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs tabular-nums text-slate-400">
                      {value.length} /{" "}
                      {maxLength}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          moveValue(
                            index,
                            -1,
                          )
                        }
                        disabled={index === 0}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`上移第 ${
                          index + 1
                        } 项`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          moveValue(
                            index,
                            1,
                          )
                        }
                        disabled={
                          index ===
                          values.length - 1
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`下移第 ${
                          index + 1
                        } 项`}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeValue(index)
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
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
            </div>
          ))
        )}

        {values.length > 0 ? (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-slate-400">
              已添加 {values.length} 项，最多{" "}
              {maxItems} 项
            </p>

            <button
              type="button"
              onClick={addValue}
              disabled={
                values.length >= maxItems
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              {addButtonText}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}