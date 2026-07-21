"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminNewsActions({
  id,
  deleted,
  onUpdate,
}: {
  id: string;
  deleted: boolean;
  onUpdate?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!confirm("确认删除这条新闻？图片文件不会被删除。")) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/news/${id}`, { method: "DELETE" });
      const data = (await response.json()) as { success: boolean; error?: { message: string } };
      if (!response.ok || !data.success) {
        setError(data.error?.message ?? "删除失败");
        return;
      }
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setLoading(false);
    }
  }

  async function restore() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/news/${id}/restore`, { method: "POST" });
      const data = (await response.json()) as { success: boolean; error?: { message: string } };
      if (!response.ok || !data.success) {
        setError(data.error?.message ?? "恢复失败");
        return;
      }
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "恢复失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link href={`/admin/news/${id}/edit`} className="text-blue-600">
        编辑
      </Link>
      {deleted ? (
        <button type="button" disabled={loading} onClick={restore} className="text-emerald-700 disabled:opacity-50">
          恢复
        </button>
      ) : (
        <button type="button" disabled={loading} onClick={remove} className="text-red-600 disabled:opacity-50">
          删除
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
