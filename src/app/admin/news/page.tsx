"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminNewsActions from "@/components/admin/AdminNewsActions";

type NewsItem = {
  id: string;
  title: string;
  slug: string;
  locale: "zh" | "en";
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  publishedAt: string | null;
  updatedAt: string;
  deletedAt: string | null;
};

export default function AdminNewsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNews = async () => {
    try {
      const url = new URL("/api/admin/news", window.location.origin);
      const response = await fetch(url.toString());
      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as { success: boolean; items?: NewsItem[]; data?: { items: NewsItem[] } };
      const newsList = data.items || data.data?.items || [];
      setItems(newsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, [router]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center text-slate-600">加载中...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">新闻管理</h1>
        <Link href="/admin/news/create" className="rounded-md bg-blue-600 px-4 py-2 text-white">
          创建新闻
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">标题</th>
              <th className="px-4 py-3">语言</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">推荐</th>
              <th className="px-4 py-3">发布时间</th>
              <th className="px-4 py-3">更新时间</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{item.title}</td>
                <td className="px-4 py-3">{item.locale === "zh" ? "中文" : "English"}</td>
                <td className="px-4 py-3">{item.deletedAt ? "已删除" : item.status}</td>
                <td className="px-4 py-3">{item.isFeatured ? "是" : "否"}</td>
                <td className="px-4 py-3">{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "-"}</td>
                <td className="px-4 py-3">{new Date(item.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <AdminNewsActions id={item.id} deleted={Boolean(item.deletedAt)} onUpdate={loadNews} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
