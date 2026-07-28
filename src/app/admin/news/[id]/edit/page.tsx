"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import NewsForm, {
  type NewsFormInitialValue,
} from "@/components/admin/NewsForm";

type NewsDetail = {
  id: string;
  title: string;
  slug: string;
  locale: "zh" | "en";
  summary: string | null;

  coverImageAssetId: string | null;

  coverImageAsset: {
    id: string;
    url: string;
    filename?: string | null;
    originalName?: string | null;
    mimeType?: string | null;
    size?: number | null;
    width?: number | null;
    height?: number | null;
    alt?: string | null;
  } | null;

  coverImageAlt: string | null;

  content: NewsFormInitialValue["content"];

  authorName: string | null;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  publishedAt: string | null;

  sourceType: "MANUAL" | "WECHAT";
  sourceUrl: string | null;
  sourceAccountName: string | null;
  sourceArticleId: string | null;
  sourcePublishedAt: string | null;
  importMeta: unknown;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

export default function AdminEditNewsPage() {
  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();

  const [news, setNews] =
    useState<NewsDetail | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadNews() {
      setLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            `/api/news/${params.id}`,
            {
              credentials:
                "include",
              cache: "no-store",
              signal:
                controller.signal,
            },
          );

        const result =
          (await response.json()) as ApiResponse<NewsDetail>;

        if (
          response.status === 401
        ) {
          router.replace(
            "/admin/login",
          );

          return;
        }

        if (
          response.status === 404
        ) {
          setError(
            "新闻不存在或已被删除",
          );

          return;
        }

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          setError(
            result.error?.message ??
              "新闻加载失败",
          );

          return;
        }

        setNews(result.data);
      } catch (requestError) {
        if (
          requestError instanceof
            Error &&
          requestError.name ===
            "AbortError"
        ) {
          return;
        }

        setError(
          "新闻加载失败，请稍后重试",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadNews();

    return () => {
      controller.abort();
    };
  }, [params.id, router]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
          正在加载新闻...
        </div>
      </main>
    );
  }

  if (error || !news) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
          {error || "新闻不存在"}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/news",
            )
          }
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          返回新闻列表
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          编辑新闻
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          修改新闻内容不会改变现有页面地址。
        </p>
      </div>

      <NewsForm
        mode="edit"
        id={news.id}
        initialValue={{
          title:
            news.title,

          locale:
            news.locale,

          summary:
            news.summary ?? "",

          /*
           * 这里必须同时传素材 ID 和素材对象。
           * 素材 ID 用于保存，素材对象用于显示封面预览。
           */
          coverImageAssetId:
            news.coverImageAssetId,

          coverImageAsset:
            news.coverImageAsset,

          coverImageAlt:
            news.coverImageAlt ?? "",

          content:
            news.content,

          authorName:
            news.authorName ?? "",

          status:
            news.status,

          isFeatured:
            news.isFeatured,

          publishedAt:
            news.publishedAt ?? "",

          sourceType:
            news.sourceType,

          sourceUrl:
            news.sourceUrl ?? "",

          sourceAccountName:
            news.sourceAccountName ??
            "",

          sourceArticleId:
            news.sourceArticleId ??
            "",

          sourcePublishedAt:
            news.sourcePublishedAt ??
            "",

          importMeta:
            news.importMeta,
        }}
      />
    </main>
  );
}