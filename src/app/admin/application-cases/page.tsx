"use client";

import {
  ChevronDown,
  Edit3,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type ApplicationCaseLocale = "zh" | "en";

type ApplicationCaseItem = {
  id: string;
  locale: ApplicationCaseLocale;
  title: string;
  slug: string;
  caseDate: string;
  contentParagraphCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  imageAsset: {
    id: string;
    url: string;
    width: number | null;
    height: number | null;
    alt: string | null;
  } | null;
};

type PaginationInfo = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export default function ApplicationCaseListPage() {
  const [items, setItems] = useState<
    ApplicationCaseItem[]
  >([]);

  const [pagination, setPagination] =
    useState<PaginationInfo>({
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] =
    useState("");

  const [selectedLocale, setSelectedLocale] =
    useState<ApplicationCaseLocale | "">("");

  const [showDeleted, setShowDeleted] =
    useState(false);

  const [sortBy, setSortBy] = useState<
    | "caseDate"
    | "createdAt"
    | "updatedAt"
    | "title"
  >("caseDate");

  const [sortOrder, setSortOrder] = useState<
    "asc" | "desc"
  >("desc");

  const [actioningId, setActioningId] =
    useState<string | null>(null);

  const fetchList = useCallback(
    async (pageNum: number = 1) => {
      setLoading(true);

      try {
        const params = new URLSearchParams();

        params.append("page", pageNum.toString());
        params.append("pageSize", "20");

        if (selectedLocale) {
          params.append(
            "locale",
            selectedLocale,
          );
        }

        if (searchKeyword) {
          params.append(
            "keyword",
            searchKeyword,
          );
        }

        if (showDeleted) {
          params.append("deleted", "true");
        }

        params.append("sort", sortBy);
        params.append("order", sortOrder);

        const response =
          await fetch(
            `/api/admin/application-cases?${params.toString()}`,
          );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch",
          );
        }

        const data =
          await response.json();

        if (data.success) {
          setItems(
            data.data.items || [],
          );

          setPagination(
            data.data.pagination,
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [
      selectedLocale,
      searchKeyword,
      showDeleted,
      sortBy,
      sortOrder,
    ],
  );

  useEffect(() => {
    fetchList(1);
  }, [fetchList]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (
        !window.confirm(
          "确定要删除这个应用案例吗？",
        )
      ) {
        return;
      }

      setActioningId(id);

      try {
        const response = await fetch(
          `/api/admin/application-cases/${id}`,
          { method: "DELETE" },
        );

        if (response.ok) {
          await fetchList(
            pagination.page,
          );
        }
      } finally {
        setActioningId(null);
      }
    },
    [pagination.page, fetchList],
  );

  const handleRestore = useCallback(
    async (id: string) => {
      if (
        !window.confirm(
          "确定要恢复这个应用案例吗？",
        )
      ) {
        return;
      }

      setActioningId(id);

      try {
        const response = await fetch(
          `/api/admin/application-cases/${id}/restore`,
          { method: "POST" },
        );

        if (response.ok) {
          await fetchList(
            pagination.page,
          );
        }
      } finally {
        setActioningId(null);
      }
    },
    [pagination.page, fetchList],
  );

  const localeLabel = useMemo(() => {
    return {
      zh: "中文",
      en: "英文",
    };
  }, []);

  const dateFormatter = useCallback(
    (date: string) => {
      try {
        return new Date(
          date,
        ).toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      } catch {
        return date;
      }
    },
    [],
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">
            应用案例
          </h1>

          <p className="text-sm text-slate-600">
            共 {pagination.total}{" "}
            个应用案例
          </p>
        </div>

        <Link
          href="/admin/application-cases/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新建应用案例
        </Link>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              搜索
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchKeyword}
                onChange={(e) =>
                  setSearchKeyword(
                    e.target.value,
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchList(1);
                  }
                }}
                placeholder="搜索标题或 Slug..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              语言
            </label>

            <select
              value={selectedLocale}
              onChange={(e) => {
                setSelectedLocale(
                  e.target
                    .value as ApplicationCaseLocale | ""
                );

                fetchList(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">
                全部语言
              </option>

              <option value="zh">中文</option>

              <option value="en">英文</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              状态
            </label>

            <button
              onClick={() => {
                setShowDeleted(
                  !showDeleted,
                );

                fetchList(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 hover:bg-slate-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {showDeleted
                ? "回收站"
                : "正常数据"}
            </button>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() =>
                fetchList(1)
              }
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              刷新
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  图片
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  标题
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  语言
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  日期
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  段落数
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  操作
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-200 hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    {item.imageAsset ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded">
                        <Image
                          src={
                            item.imageAsset.url
                          }
                          alt={
                            item.imageAsset.alt ||
                            item.title
                          }
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-100">
                        <Package className="h-6 w-6 text-slate-400" />
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {item.title}
                      </p>

                      <p className="text-sm text-slate-500">
                        {item.slug}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                      {
                        localeLabel[
                          item.locale
                        ]
                      }
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {dateFormatter(
                      item.caseDate,
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {
                      item.contentParagraphCount
                    }
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {!showDeleted && (
                        <>
                          <Link
                            href={`/admin/application-cases/${item.id}/edit`}
                            className="inline-flex items-center gap-1 rounded px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>

                          <button
                            onClick={() =>
                              handleDelete(
                                item.id,
                              )
                            }
                            disabled={
                              actioningId ===
                              item.id
                            }
                            className="inline-flex items-center gap-1 rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {actioningId ===
                            item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}

                      {showDeleted && (
                        <button
                          onClick={() =>
                            handleRestore(
                              item.id,
                            )
                          }
                          disabled={
                            actioningId ===
                            item.id
                          }
                          className="inline-flex items-center gap-1 rounded px-3 py-1 text-sm text-green-600 hover:bg-green-50 disabled:opacity-50"
                        >
                          {actioningId ===
                          item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          恢复
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 p-4 md:hidden">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex gap-4">
                {item.imageAsset ? (
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded">
                    <Image
                      src={item.imageAsset.url}
                      alt={
                        item.imageAsset.alt ||
                        item.title
                      }
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded bg-slate-100">
                    <Package className="h-8 w-8 text-slate-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">
                    {item.title}
                  </p>

                  <p className="text-xs text-slate-500">
                    {item.slug}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      {
                        localeLabel[
                          item.locale
                        ]
                      }
                    </span>

                    <span className="text-xs text-slate-600">
                      {dateFormatter(
                        item.caseDate,
                      )}
                    </span>

                    <span className="text-xs text-slate-600">
                      {
                        item.contentParagraphCount
                      }
                      {" "}
                      段
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {!showDeleted && (
                  <>
                    <Link
                      href={`/admin/application-cases/${item.id}/edit`}
                      className="flex-1 rounded bg-blue-50 py-2 text-center text-sm text-blue-600 hover:bg-blue-100"
                    >
                      编辑
                    </Link>

                    <button
                      onClick={() =>
                        handleDelete(item.id)
                      }
                      disabled={
                        actioningId ===
                        item.id
                      }
                      className="flex-1 rounded bg-red-50 py-2 text-sm text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      {actioningId ===
                      item.id ? (
                        <Loader2 className="inline-block h-4 w-4 animate-spin" />
                      ) : (
                        "删除"
                      )}
                    </button>
                  </>
                )}

                {showDeleted && (
                  <button
                    onClick={() =>
                      handleRestore(item.id)
                    }
                    disabled={
                      actioningId === item.id
                    }
                    className="flex-1 rounded bg-green-50 py-2 text-sm text-green-600 hover:bg-green-100 disabled:opacity-50"
                  >
                    {actioningId === item.id ? (
                      <Loader2 className="inline-block h-4 w-4 animate-spin" />
                    ) : (
                      "恢复"
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Package className="mb-4 h-12 w-12 text-slate-400" />

            <p>暂无应用案例</p>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-slate-600">
            第 {pagination.page} 页，共{" "}
            {pagination.totalPages} 页
          </p>

          <div className="flex gap-2">
            <button
              onClick={() =>
                fetchList(
                  pagination.page - 1,
                )
              }
              disabled={
                !pagination.hasPreviousPage ||
                loading
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            >
              上一页
            </button>

            <button
              onClick={() =>
                fetchList(
                  pagination.page + 1,
                )
              }
              disabled={
                !pagination.hasNextPage ||
                loading
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
