"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

type NewsLocale = "zh" | "en";
type NewsStatus = "DRAFT" | "PUBLISHED";
type NewsSourceType = "MANUAL" | "WECHAT";
type NewsView = "active" | "trash";

type NewsItem = {
  id: string;
  title: string;
  slug: string;
  locale: NewsLocale;
  summary: string | null;

  coverImage: string | null;
  coverImageAlt: string | null;

  coverImageAsset?: {
    id: string;
    url: string;
    alt: string | null;
  } | null;

  authorName: string | null;
  status: NewsStatus;
  isFeatured: boolean;

  sourceType: NewsSourceType;
  sourceAccountName: string | null;

  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type NewsListData = {
  items: NewsItem[];
  pagination: Pagination;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    fieldErrors?: Record<string, string[]>;
  };
};

const initialPagination: Pagination = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export default function AdminNewsPage() {
  const [view, setView] =
    useState<NewsView>("active");

  const [items, setItems] =
    useState<NewsItem[]>([]);

  const [pagination, setPagination] =
    useState<Pagination>(
      initialPagination,
    );

  const [page, setPage] =
    useState(1);

  const [keywordInput, setKeywordInput] =
    useState("");

  const [keyword, setKeyword] =
    useState("");

  const [locale, setLocale] =
    useState<"" | NewsLocale>("");

  const [status, setStatus] =
    useState<"" | NewsStatus>("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionId, setActionId] =
    useState<string | null>(null);

  const loadNews = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const parameters =
          new URLSearchParams({
            page: String(page),
            pageSize: "10",
            deleted:
              view === "trash"
                ? "true"
                : "false",
            sort:
              view === "trash"
                ? "updatedAt"
                : "createdAt",
            order: "desc",
          });

        if (keyword) {
          parameters.set(
            "keyword",
            keyword,
          );
        }

        if (locale) {
          parameters.set(
            "locale",
            locale,
          );
        }

        if (status) {
          parameters.set(
            "status",
            status,
          );
        }

        const response = await fetch(
          `/api/admin/news?${parameters.toString()}`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as ApiResponse<NewsListData>;

        if (response.status === 401) {
          window.location.href =
            "/admin/login";
          return;
        }

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          setError(
            result.error?.message ??
              "新闻列表加载失败",
          );
          return;
        }

        setItems(
          result.data.items,
        );

        setPagination(
          result.data.pagination,
        );
      } catch {
        setError(
          "新闻列表加载失败，请稍后重试",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      keyword,
      locale,
      page,
      status,
      view,
    ],
  );

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  function switchView(
    nextView: NewsView,
  ) {
    setView(nextView);
    setPage(1);
    setError("");
  }

  function submitSearch(
    event: FormEvent,
  ) {
    event.preventDefault();

    setPage(1);
    setKeyword(
      keywordInput.trim(),
    );
  }

  function resetFilters() {
    setKeywordInput("");
    setKeyword("");
    setLocale("");
    setStatus("");
    setPage(1);
  }

  async function deleteNews(
    item: NewsItem,
  ) {
    const confirmed =
      window.confirm(
        `确认删除新闻“${item.title}”吗？\n\n删除后可以在回收站中恢复。`,
      );

    if (!confirmed) {
      return;
    }

    setActionId(item.id);
    setError("");

    try {
      const response =
        await fetch(
          `/api/news/${item.id}`,
          {
            method: "DELETE",
            credentials:
              "include",
          },
        );

      const result =
        (await response.json()) as ApiResponse<{
          id: string;
        }>;

      if (
        !response.ok ||
        !result.success
      ) {
        window.alert(
          result.error?.message ??
            "新闻删除失败",
        );
        return;
      }

      if (
        items.length === 1 &&
        page > 1
      ) {
        setPage(
          (current) =>
            current - 1,
        );
      } else {
        await loadNews();
      }
    } catch {
      window.alert(
        "新闻删除失败，请稍后重试",
      );
    } finally {
      setActionId(null);
    }
  }

  async function restoreNews(
    item: NewsItem,
  ) {
    const confirmed =
      window.confirm(
        `确认恢复新闻“${item.title}”吗？`,
      );

    if (!confirmed) {
      return;
    }

    setActionId(item.id);
    setError("");

    try {
      const response =
        await fetch(
          `/api/news/${item.id}/restore`,
          {
            method: "POST",
            credentials:
              "include",
          },
        );

      const result =
        (await response.json()) as ApiResponse<{
          id: string;
        }>;

      if (
        !response.ok ||
        !result.success
      ) {
        window.alert(
          result.error?.message ??
            "新闻恢复失败",
        );
        return;
      }

      window.alert(
        "新闻已恢复",
      );

      if (
        items.length === 1 &&
        page > 1
      ) {
        setPage(
          (current) =>
            current - 1,
        );
      } else {
        await loadNews();
      }
    } catch {
      window.alert(
        "新闻恢复失败，请稍后重试",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            新闻管理
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            管理手动新闻和微信公众号导入内容。
          </p>
        </div>

        <Link
          href="/admin/news/create"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          创建新闻
        </Link>
      </header>

      <section className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() =>
              switchView("active")
            }
            className={tabClass(
              view === "active",
            )}
          >
            正常新闻
          </button>

          <button
            type="button"
            onClick={() =>
              switchView("trash")
            }
            className={tabClass(
              view === "trash",
            )}
          >
            回收站
          </button>
        </div>

        <form
          onSubmit={submitSearch}
          className="grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_160px_160px_auto]"
        >
          <input
            value={keywordInput}
            onChange={(event) =>
              setKeywordInput(
                event.target.value,
              )
            }
            placeholder="搜索标题、摘要或正文"
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <select
            value={locale}
            onChange={(event) => {
              setLocale(
                event.target
                  .value as
                  | ""
                  | NewsLocale,
              );
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">
              全部语言
            </option>
            <option value="zh">
              中文
            </option>
            <option value="en">
              English
            </option>
          </select>

          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target
                  .value as
                  | ""
                  | NewsStatus,
              );
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">
              全部状态
            </option>
            <option value="DRAFT">
              草稿
            </option>
            <option value="PUBLISHED">
              已发布
            </option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white transition hover:bg-slate-700"
            >
              搜索
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              重置
            </button>
          </div>
        </form>
      </section>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              {view === "trash"
                ? "已删除新闻"
                : "新闻列表"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              共 {pagination.total} 条记录
            </p>
          </div>

          {view === "trash" && (
            <p className="text-sm text-amber-700">
              回收站中的公众号文章不能重复创建，请先恢复。
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">
                  新闻
                </th>

                <th className="px-5 py-3">
                  语言
                </th>

                <th className="px-5 py-3">
                  状态
                </th>

                <th className="px-5 py-3">
                  来源
                </th>

                <th className="px-5 py-3">
                  {view === "trash"
                    ? "删除时间"
                    : "发布时间"}
                </th>

                <th className="px-5 py-3 text-right">
                  操作
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-sm text-slate-500"
                  >
                    正在加载新闻...
                  </td>
                </tr>
              ) : items.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-sm text-slate-500"
                  >
                    {view === "trash"
                      ? "回收站为空"
                      : "暂无新闻"}
                  </td>
                </tr>
              ) : (
                items.map(
                  (item) => {
                    const image =
                      item
                        .coverImageAsset
                        ?.url ??
                      item.coverImage;

                    const busy =
                      actionId ===
                      item.id;

                    return (
                      <tr
                        key={item.id}
                        className="align-top hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-[320px] gap-3">
                            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              {image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={image}
                                  alt={
                                    item.coverImageAlt ||
                                    item.title
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                  无封面
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="line-clamp-2 font-medium text-slate-900">
                                {item.title}
                              </p>

                              {item.summary && (
                                <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                                  {item.summary}
                                </p>
                              )}

                              <div className="mt-2 flex flex-wrap gap-2">
                                {item.isFeatured && (
                                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                                    推荐
                                  </span>
                                )}

                                {item.authorName && (
                                  <span className="text-xs text-slate-400">
                                    作者：
                                    {
                                      item.authorName
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {item.locale ===
                            "zh"
                              ? "中文"
                              : "English"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={
                              item.status
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          {item.sourceType ===
                          "WECHAT" ? (
                            <div>
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                微信公众号
                              </span>

                              {item.sourceAccountName && (
                                <p className="mt-2 max-w-40 truncate text-xs text-slate-500">
                                  {
                                    item.sourceAccountName
                                  }
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                              手动创建
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {formatDateTime(
                            view === "trash"
                              ? item.deletedAt
                              : item.publishedAt ??
                                  item.createdAt,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          {view === "trash" ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                restoreNews(
                                  item,
                                )
                              }
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busy
                                ? "恢复中..."
                                : "恢复"}
                            </button>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/admin/news/${item.id}/edit`}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                              >
                                编辑
                              </Link>

                              {item.status ===
                                "PUBLISHED" && (
                                <Link
                                  href={`/${item.locale}/news/${item.slug}`}
                                  target="_blank"
                                  className="rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-50"
                                >
                                  查看
                                </Link>
                              )}

                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  deleteNews(
                                    item,
                                  )
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {busy
                                  ? "删除中..."
                                  : "删除"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  },
                )
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-500">
            第 {pagination.page} 页，共{" "}
            {Math.max(
              pagination.totalPages,
              1,
            )}{" "}
            页
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={
                loading ||
                !pagination.hasPreviousPage
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1,
                    ),
                )
              }
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              上一页
            </button>

            <button
              type="button"
              disabled={
                loading ||
                !pagination.hasNextPage
              }
              onClick={() =>
                setPage(
                  (current) =>
                    current + 1,
                )
              }
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: NewsStatus;
}) {
  if (status === "PUBLISHED") {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
        已发布
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
      草稿
    </span>
  );
}

function tabClass(
  active: boolean,
) {
  return [
    "border-b-2 px-5 py-3 text-sm font-medium transition",
    active
      ? "border-blue-600 bg-blue-50 text-blue-700"
      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900",
  ].join(" ");
}

function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "zh-CN",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  );
}