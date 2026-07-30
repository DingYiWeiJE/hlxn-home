"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";

type ParagraphItem = {
  id: string;
  value: string;
};

type Props = {
  paragraphs: ParagraphItem[];
  onChange: (paragraphs: ParagraphItem[]) => void;
  disabled?: boolean;
  error?: string;
};

function createParagraph(): ParagraphItem {
  return {
    id: crypto.randomUUID(),
    value: "",
  };
}

export function createInitialParagraphs(values?: string[]): ParagraphItem[] {
  const items =
    values && values.length > 0
      ? values.map((value) => ({
          id: crypto.randomUUID(),
          value,
        }))
      : [createParagraph()];

  return items;
}

export default function CompanyHistoryParagraphsEditor({
  paragraphs,
  onChange,
  disabled = false,
  error,
}: Props) {
  const cleanedCount = useMemo(
    () => paragraphs.filter((item) => item.value.trim()).length,
    [paragraphs],
  );

  function updateValue(id: string, value: string) {
    onChange(paragraphs.map((item) => (item.id === id ? { ...item, value } : item)));
  }

  function remove(id: string) {
    const next = paragraphs.filter((item) => item.id !== id);
    onChange(next.length > 0 ? next : [createParagraph()]);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= paragraphs.length) {
      return;
    }

    const next = [...paragraphs];
    const current = next[index];
    const targetItem = next[target];
    if (!current || !targetItem) {
      return;
    }

    next[index] = targetItem;
    next[target] = current;
    onChange(next);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            事件详情自然段
            <span className="text-red-500">*</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            至少保留一个非空自然段，提交时会自动过滤空段落。当前有效段落：{cleanedCount}
          </p>
        </div>

        <button
          type="button"
          disabled={disabled || paragraphs.length >= 20}
          onClick={() => onChange([...paragraphs, createParagraph()])}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          新增自然段
        </button>
      </div>

      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <div key={paragraph.id} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                段落 {index + 1}
              </span>

              <div className="flex gap-1">
                <button
                  type="button"
                  title="上移"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="下移"
                  disabled={disabled || index === paragraphs.length - 1}
                  onClick={() => move(index, 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="删除"
                  disabled={disabled}
                  onClick={() => remove(paragraph.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <textarea
              value={paragraph.value}
              disabled={disabled}
              rows={5}
              maxLength={3000}
              onChange={(event) => updateValue(paragraph.id, event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
              placeholder="请输入该阶段的发展历程详情"
            />
            <p className="mt-2 text-right text-xs text-slate-500">
              {paragraph.value.length} / 3000
            </p>
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
