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
  const [locale, setLocale] = useState<"zh" | "en">("zh");

  const loadNews = async () => {
    try {
      const url = new URL("/api/admin/news", window.location.origin);
      url.searchParams.set("locale", locale);
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
  }, [router, locale]);

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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">新闻管理</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setLocale("zh")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                locale === "zh"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              中文
            </button>
            <button
              onClick={() => setLocale("en")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                locale === "en"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              English
            </button>
          </div>
          <Link href="/admin/news/create" className="rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700">
            创建新闻
          </Link>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white lg:block">
        <div className="overflow-x-auto">
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
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 lg:hidden">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="flex-1 text-base font-semibold text-slate-800">{item.title}</h3>
              <AdminNewsActions id={item.id} deleted={Boolean(item.deletedAt)} onUpdate={loadNews} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">语言:</span>
                <span className="font-medium">{item.locale === "zh" ? "中文" : "English"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">状态:</span>
                <span className="font-medium">{item.deletedAt ? "已删除" : item.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">推荐:</span>
                <span className="font-medium">{item.isFeatured ? "是" : "否"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">发布时间:</span>
                <span className="font-medium">{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">更新时间:</span>
                <span className="font-medium">{new Date(item.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && !isLoading && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-12 text-center text-slate-500">
          暂无{locale === "zh" ? "中文" : "英文"}新闻
        </div>
      )}
    </main>
  );
}
