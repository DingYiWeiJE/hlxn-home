"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminNewsActions({ id, deleted }: { id: string; deleted: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm("确认删除这条新闻？图片文件不会被删除。")) return;
    setLoading(true);
    await fetch(`/api/news/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  async function restore() {
    setLoading(true);
    await fetch(`/api/news/${id}/restore`, { method: "POST" });
    setLoading(false);
    router.refresh();
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
    </div>
  );
}
