"use client";

import { X, Plus, Trash2, Loader2, Pencil, Check, XCircle } from "lucide-react";
import { useState, useEffect } from "react";

export type NewsTypeItem = {
  id: string;
  chName: string;
  enName: string;
  createdAt: string;
  updatedAt: string;
};

type NewsTypeManagerProps = {
  open: boolean;
  onClose: () => void;
  onTypesChanged?: (types: NewsTypeItem[]) => void;
};

export default function NewsTypeManager({
  open,
  onClose,
  onTypesChanged,
}: NewsTypeManagerProps) {
  const [types, setTypes] = useState<NewsTypeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [chName, setChName] = useState("");
  const [enName, setEnName] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editChName, setEditChName] = useState("");
  const [editEnName, setEditEnName] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTypes();
    }
  }, [open]);

  async function fetchTypes() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/news-types", {
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        setTypes(result.data.types);
        onTypesChanged?.(result.data.types);
      } else {
        setError(result.error?.message || "加载新闻类型失败");
      }
    } catch (err) {
      setError("加载新闻类型失败");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddType(e: React.FormEvent) {
    e.preventDefault();
    if (!chName.trim() || !enName.trim()) {
      setError("中文名和英文名都不能为空");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/news-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chName, enName }),
      });
      const result = await response.json();
      if (result.success) {
        const newType = result.data;
        const nextTypes = [...types, newType];
        setTypes(nextTypes);
        onTypesChanged?.(nextTypes);
        setChName("");
        setEnName("");
      } else {
        setError(result.error?.message || "添加新闻类型失败");
      }
    } catch (err) {
      setError("添加新闻类型失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEditing(type: NewsTypeItem) {
    setEditingId(type.id);
    setEditChName(type.chName);
    setEditEnName(type.enName);
    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditChName("");
    setEditEnName("");
  }

  async function handleUpdateType(id: string) {
    if (!editChName.trim() || !editEnName.trim()) {
      setError("中文名和英文名都不能为空");
      return;
    }

    setEditSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/news-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chName: editChName, enName: editEnName }),
      });
      const result = await response.json();
      if (result.success) {
        const updated: NewsTypeItem = result.data;
        const nextTypes = types.map((t) => (t.id === id ? updated : t));
        setTypes(nextTypes);
        onTypesChanged?.(nextTypes);
        cancelEditing();
      } else {
        setError(result.error?.message || "更新新闻类型失败");
      }
    } catch (err) {
      setError("更新新闻类型失败");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDeleteType(id: string) {
    if (!confirm("删除后使用该类型的历史新闻将不再显示分类，确定要删除吗？")) return;

    try {
      const response = await fetch(`/api/admin/news-types/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        const nextTypes = types.filter((t) => t.id !== id);
        setTypes(nextTypes);
        onTypesChanged?.(nextTypes);
      } else {
        setError(result.error?.message || "删除新闻类型失败");
      }
    } catch (err) {
      setError("删除新闻类型失败");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">管理新闻类型</h2>
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

        <form onSubmit={handleAddType} className="mb-6 space-y-3">
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
          ) : types.length === 0 ? (
            <div className="text-center text-sm text-slate-500">暂无类型</div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {types.map((type) => {
                const isEditing = editingId === type.id;
                return (
                  <div
                    key={type.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={editChName}
                          onChange={(e) => setEditChName(e.target.value)}
                          placeholder="中文名"
                          maxLength={100}
                          className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <input
                          value={editEnName}
                          onChange={(e) => setEditEnName(e.target.value)}
                          placeholder="英文名"
                          maxLength={100}
                          className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEditing}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 transition hover:bg-slate-100"
                            disabled={editSubmitting}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            取消
                          </button>
                          <button
                            onClick={() => handleUpdateType(type.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-md bg-blue-600 px-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                            disabled={editSubmitting}
                          >
                            {editSubmitting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {type.chName}
                          </p>
                          <p className="text-xs text-slate-500">{type.enName}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => startEditing(type)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-blue-500"
                            aria-label="编辑"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteType(type.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-500"
                            aria-label="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
