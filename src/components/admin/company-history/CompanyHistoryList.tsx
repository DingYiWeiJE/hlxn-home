"use client";

import { Edit3, Eye, History, Loader2, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";

type Locale = "zh" | "en";

type Item = {
  id: string;
  locale: Locale;
  displayTime: string;
  sortDate: string;
  sortOrder: number;
  title: string | null;
  detailParagraphCount: number;
  createdAt: string;
  updatedAt: string;
  imageAsset: {
    id: string;
    url: string;
    width: number | null;
    height: number | null;
    alt: string | null;
  } | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ListResponse =
  | {
      success: true;
      data: {
        items: Item[];
        pagination: Pagination;
      };
    }
  | {
      success: false;
      error: {
        message: string;
      };
    };

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CompanyHistoryList() {
  const [items, setItems] = useState<Item[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [locale, setLocale] = useState<Locale | "">("");
  const [sortDateFrom, setSortDateFrom] = useState("");
  const [sortDateTo, setSortDateTo] = useState("");
  const [sort, setSort] = useState("sortDate");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadItems = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "20",
          sort,
          order,
        });

        if (keyword) {
          params.set("keyword", keyword);
        }
        if (locale) {
          params.set("locale", locale);
        }
        if (sortDateFrom) {
          params.set("sortDateFrom", sortDateFrom);
        }
        if (sortDateTo) {
          params.set("sortDateTo", sortDateTo);
        }

        const response = await fetch(`/api/admin/company-history?${params.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });
        const result = (await response.json()) as ListResponse;

        if (!response.ok || !result.success) {
          throw new Error(result.success ? "加载失败" : result.error.message);
        }

        setItems(result.data.items);
        setPagination(result.data.pagination);
      } catch (loadError) {
        setItems([]);
        setError(loadError instanceof Error ? loadError.message : "加载失败");
      } finally {
        setLoading(false);
      }
    },
    [keyword, locale, order, sort, sortDateFrom, sortDateTo],
  );

  useEffect(() => {
    void loadItems(1);
  }, [loadItems]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setKeyword(keywordInput.trim());
  }

  async function handleDelete(item: Item) {
    const confirmed = window.confirm(
      `确认物理删除“${item.displayTime}${item.title ? ` - ${item.title}` : ""}”吗？\n\n删除后没有回收站，无法恢复。图片素材和本地图片文件不会被删除。`,
    );

    if (!confirmed) {
      return;
    }

    setMutatingId(item.id);
    setError("");

    try {
      const response = await fetch(`/api/admin/company-history/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = (await response.json()) as
        | { success: true; data: unknown }
        | { success: false; error: { message: string } };

      if (!response.ok || !result.success) {
        throw new Error(result.success ? "删除失败" : result.error.message);
      }

      await loadItems(pagination.page);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败");
    } finally {
      setMutatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Company History
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">公司发展历程</h1>
          <p className="mt-1 text-sm text-slate-500">共 {pagination.total} 条记录</p>
        </div>
        <Link
          href="/admin/company-history/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新建发展历程
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <label className="relative md:col-span-2 xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="搜索展示时间或标题"
            />
          </label>

          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale | "")}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">全部语言</option>
            <option value="zh">中文</option>
            <option value="en">英文</option>
          </select>

          <input
            type="date"
            value={sortDateFrom}
            onChange={(event) => setSortDateFrom(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            aria-label="排序时间开始"
          />

          <input
            type="date"
            value={sortDateTo}
            onChange={(event) => setSortDateTo(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            aria-label="排序时间结束"
          />

          <select
            value={`${sort}:${order}`}
            onChange={(event) => {
              const [nextSort, nextOrder] = event.target.value.split(":");
              setSort(nextSort ?? "sortDate");
              setOrder(nextOrder === "desc" ? "desc" : "asc");
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="sortDate:asc">排序时间升序</option>
            <option value="sortDate:desc">排序时间降序</option>
            <option value="sortOrder:asc">排序值升序</option>
            <option value="createdAt:desc">创建时间降序</option>
            <option value="updatedAt:desc">更新时间降序</option>
            <option value="displayTime:asc">展示时间升序</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
            >
              搜索
            </button>
            <button
              type="button"
              onClick={() => void loadItems(pagination.page)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="刷新"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-96 items-center justify-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            正在加载发展历程
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-96 flex-col items-center justify-center px-6 text-center text-slate-500">
            <History className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm">暂无公司发展历程</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">图片</th>
                    <th className="px-5 py-4">展示时间</th>
                    <th className="px-5 py-4">排序时间</th>
                    <th className="px-5 py-4">事件标题</th>
                    <th className="px-5 py-4">段落数</th>
                    <th className="px-5 py-4">语言</th>
                    <th className="px-5 py-4">排序值</th>
                    <th className="px-5 py-4">创建/更新</th>
                    <th className="px-5 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        {item.imageAsset ? (
                          <div className="relative h-14 w-20 overflow-hidden rounded-lg bg-slate-100">
                            <Image
                              src={item.imageAsset.url}
                              alt={item.imageAsset.alt || item.title || item.displayTime}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-slate-100">
                            <ImageIconFallback />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {item.displayTime}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(item.sortDate)}
                      </td>
                      <td className="max-w-xs px-5 py-4 text-sm text-slate-700">
                        <span className="line-clamp-2">{item.title || "-"}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {item.detailParagraphCount}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {item.locale === "zh" ? "中文" : "英文"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {item.sortOrder}
                      </td>
                      <td className="px-5 py-4 text-xs leading-6 text-slate-500">
                        <div>{formatDateTime(item.createdAt)}</div>
                        <div>{formatDateTime(item.updatedAt)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/${item.locale}/about`}
                            target="_blank"
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            About
                          </Link>
                          <Link
                            href={`/admin/company-history/${item.id}/edit`}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            编辑
                          </Link>
                          <button
                            type="button"
                            disabled={mutatingId === item.id}
                            onClick={() => void handleDelete(item)}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {mutatingId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {items.map((item) => (
                <article key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {item.imageAsset ? (
                        <Image
                          src={item.imageAsset.url}
                          alt={item.imageAsset.alt || item.title || item.displayTime}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIconFallback />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-950">
                          {item.displayTime}
                        </span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          {item.locale === "zh" ? "中文" : "英文"}
                        </span>
                      </div>
                      {item.title ? (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                          {item.title}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-500">
                        排序时间 {formatDate(item.sortDate)} / 排序值 {item.sortOrder} / 段落 {item.detailParagraphCount}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Link
                      href={`/${item.locale}/about`}
                      target="_blank"
                      className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600"
                    >
                      <Eye className="h-4 w-4" />
                      查看
                    </Link>
                    <Link
                      href={`/admin/company-history/${item.id}/edit`}
                      className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-blue-200 text-sm font-semibold text-blue-600"
                    >
                      <Edit3 className="h-4 w-4" />
                      编辑
                    </Link>
                    <button
                      type="button"
                      disabled={mutatingId === item.id}
                      onClick={() => void handleDelete(item)}
                      className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-red-200 text-sm font-semibold text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      删除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <footer className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            第 {pagination.page} 页，共 {Math.max(pagination.totalPages, 1)} 页，合计 {pagination.total} 条
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => void loadItems(pagination.page - 1)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              上一页
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => void loadItems(pagination.page + 1)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function ImageIconFallback() {
  return <History className="h-6 w-6 text-slate-300" />;
}
