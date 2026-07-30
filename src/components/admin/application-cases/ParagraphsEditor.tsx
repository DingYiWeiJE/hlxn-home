"use client";

import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  useCallback,
  useState,
} from "react";

type ParagraphsEditorProps = {
  paragraphs: string[];
  onParagraphsChange: (
    paragraphs: string[],
  ) => void;
  disabled?: boolean;
};

export default function ParagraphsEditor({
  paragraphs,
  onParagraphsChange,
  disabled = false,
}: ParagraphsEditorProps) {
  const [editingError, setEditingError] =
    useState<string | null>(null);

  const handleAddParagraph = useCallback(() => {
    onParagraphsChange([
      ...paragraphs,
      "",
    ]);
  }, [paragraphs, onParagraphsChange]);

  const handleUpdateParagraph = useCallback(
    (index: number, value: string) => {
      const updated = [...paragraphs];

      updated[index] = value;

      onParagraphsChange(updated);
    },
    [paragraphs, onParagraphsChange],
  );

  const handleDeleteParagraph = useCallback(
    (index: number) => {
      const updated =
        paragraphs.filter(
          (_, i) => i !== index,
        );

      onParagraphsChange(updated);

      setEditingError(null);
    },
    [paragraphs, onParagraphsChange],
  );

  const handleMoveParagraph = useCallback(
    (
      index: number,
      direction: "up" | "down",
    ) => {
      const updated = [...paragraphs];

      const targetIndex =
        direction === "up"
          ? index - 1
          : index + 1;

      if (
        targetIndex < 0 ||
        targetIndex >= updated.length
      ) {
        return;
      }

      const temp = updated[index];

      updated[index] =
        updated[targetIndex];

      updated[targetIndex] = temp;

      onParagraphsChange(updated);
    },
    [paragraphs, onParagraphsChange],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          应用案例内容
          <span className="text-red-500">
            *
          </span>
        </label>

        <button
          type="button"
          onClick={
            handleAddParagraph
          }
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          新增段落
        </button>
      </div>

      <p className="text-xs text-slate-500">
        至少需要一个非空自然段
      </p>

      {editingError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {editingError}
        </div>
      )}

      <div className="space-y-3">
        {paragraphs.map((paragraph, index) => (
          <div
            key={index}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                段落 {index + 1}
              </span>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() =>
                    handleMoveParagraph(
                      index,
                      "up",
                    )
                  }
                  disabled={
                    disabled || index === 0
                  }
                  title="上移"
                  className="rounded p-1 hover:bg-slate-100 disabled:opacity-50"
                >
                  <ChevronUp className="h-4 w-4 text-slate-600" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleMoveParagraph(
                      index,
                      "down",
                    )
                  }
                  disabled={
                    disabled ||
                    index ===
                      paragraphs.length - 1
                  }
                  title="下移"
                  className="rounded p-1 hover:bg-slate-100 disabled:opacity-50"
                >
                  <ChevronDown className="h-4 w-4 text-slate-600" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteParagraph(
                      index,
                    )
                  }
                  disabled={disabled}
                  title="删除"
                  className="rounded p-1 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>

            <textarea
              value={paragraph}
              onChange={(e) =>
                handleUpdateParagraph(
                  index,
                  e.target.value,
                )
              }
              disabled={disabled}
              placeholder="输入自然段内容..."
              rows={4}
              maxLength={5000}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
            />

            <div className="flex justify-end text-xs text-slate-500">
              {paragraph.length} / 5000
            </div>
          </div>
        ))}
      </div>

      {paragraphs.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-600">
            点击"新增段落"添加内容
          </p>
        </div>
      )}
    </div>
  );
}
