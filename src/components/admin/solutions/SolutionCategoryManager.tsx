"use client";

import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

type Category = {
  id: string;
  chName: string;
  enName: string;
  createdAt: string;
  updatedAt: string;
};

type SolutionCategoryManagerProps = {
  open: boolean;
  onClose: () => void;
  onCategoryAdded?: (category: Category) => void;
};

export default function SolutionCategoryManager({
  open,
  onClose,
  onCategoryAdded,
}: SolutionCategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [chName, setChName] = useState("");
  const [enName, setEnName] = useState("");

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  async function fetchCategories() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/solution-categories", {
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        setCategories(result.data.categories);
      } else {
        setError(result.error?.message || "加载分类失败");
      }
    } catch (err) {
      setError("加载分类失败");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!chName.trim() || !enName.trim()) {
      setError("中文名和英文名都不能为空");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/solution-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chName, enName }),
      });
      const result = await response.json();
      if (result.success) {
        const newCategory = result.data;
        setCategories([newCategory, ...categories]);
        setChName("");
        setEnName("");
        onCategoryAdded?.(newCategory);
      } else {
        setError(result.error?.message || "添加分类失败");
      }
    } catch (err) {
      setError("添加分类失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("确定要删除此分类吗？")) return;

    try {
      const response = await fetch(`/api/admin/solution-categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        setCategories(categories.filter((c) => c.id !== id));
      } else {
        setError(result.error?.message || "删除分类失败");
      }
    } catch (err) {
      setError("删除分类失败");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">管理解决方案类型</h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleAddCategory} className="mb-6 space-y-3">
          <input
            value={chName}
            onChange={(e) => setChName(e.target.value)}
            placeholder="中文名"
            maxLength={100}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <input
            value={enName}
            onChange={(e) => setEnName(e.target.value)}
            placeholder="英文名"
            maxLength={100}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isSubmitting ? "添加中..." : "添加类型"}
          </button>
        </form>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">现有类型</h3>
          {isLoading ? (
            <div className="text-center text-sm text-slate-500">加载中...</div>
          ) : categories.length === 0 ? (
            <div className="text-center text-sm text-slate-500">暂无类型</div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {category.chName}
                    </p>
                    <p className="text-xs text-slate-500">{category.enName}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
