"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import NewsForm from "@/components/admin/NewsForm";
import type { TiptapNode } from "@/lib/news/tiptap";

type NewsData = {
  id: string;
  title: string;
  slug: string;
  locale: "zh" | "en";
  summary: string | null;
  coverImage: string | null;
  coverImageAlt: string | null;
  authorName: string | null;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  publishedAt: string | null;
  content: TiptapNode;
};

export default function AdminEditNewsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [news, setNews] = useState<NewsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadNews = async () => {
      try {
        const url = new URL(`/api/admin/news/${id}`, window.location.origin);
        const response = await fetch(url.toString());
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!response.ok) {
          if (response.status === 404) {
            router.replace("/admin/news");
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
          return;
        }
        const data = (await response.json()) as { success: boolean; data?: NewsData };
        if (data.success && data.data) {
          setNews(data.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setIsLoading(false);
      }
    };
    loadNews();
  }, [id, router]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="text-center text-slate-600">加载中...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </main>
    );
  }

  if (!news) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">编辑新闻</h1>
      <NewsForm
        mode="edit"
        id={id}
        initialValue={{
          title: news.title,
          slug: news.slug,
          locale: news.locale,
          summary: news.summary ?? "",
          coverImage: news.coverImage ?? "",
          coverImageAlt: news.coverImageAlt ?? "",
          authorName: news.authorName ?? "",
          status: news.status,
          isFeatured: news.isFeatured,
          publishedAt: news.publishedAt ? new Date(news.publishedAt).toISOString().slice(0, 16) : "",
          content: news.content,
        }}
      />
    </main>
  );
}
