"use client";

import {
  ChevronDown,
  Edit3,
  Eye,
  Languages,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  DataTable,
  type DataTableColumn,
  type DataTablePaginationProps,
} from "@/components/admin/DataTable";

type SolutionLocale = "zh" | "en";
type SolutionStatus = "DRAFT" | "PUBLISHED";

type SolutionItem = {
  id: string;
  locale: SolutionLocale;
  name: string;
  slug: string;
  status: SolutionStatus;
  sortOrder: number;
  translationKey: string | null;
  publishedAt: string | null;
  updatedAt: string;
  deletedAt: string | null;
  counts: {
    usageScenarios: number;
    customerValues: number;
  };
  detailUrl: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};

type ListResponse =
  | {
      success: true;
      data: {
        items: SolutionItem[];
        pagination: Pagination;
      };
    }
  | ApiFailure;

type MutateResponse =
  | {
      success: true;
      data: unknown;
    }
  | ApiFailure;

function getErrorMessage(result: ListResponse | MutateResponse): string {
  if (!result.success) {
    const firstFieldError = Object.values(
      result.error.fieldErrors ?? {},
    ).flat()[0];

    return firstFieldError || result.error.message;
  }

  return "Request failed";
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function SolutionCatalog() {
  const [items, setItems] = useState<SolutionItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [locale, setLocale] = useState<"ALL" | SolutionLocale>("ALL");
  const [status, setStatus] = useState<"ALL" | SolutionStatus>("ALL");
  const [deleted, setDeleted] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadItems = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError("");

      try {
        const searchParams = new URLSearchParams({
          page: String(page),
          pageSize: "20",
          sort: "createdAt",
          order: "desc",
          deleted: String(deleted),
        });

        if (locale !== "ALL") {
          searchParams.set("locale", locale);
        }

        if (status !== "ALL") {
          searchParams.set("status", status);
        }

        if (keyword) {
          searchParams.set("keyword", keyword);
        }

        const response = await fetch(
          `/api/admin/solutions?${searchParams.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
          },
        );
        const result = (await response.json()) as ListResponse;

        if (!response.ok || !result.success) {
          throw new Error(getErrorMessage(result));
        }

        setItems(result.data.items);
        setPagination(result.data.pagination);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载失败");
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    },
    [deleted, keyword, locale, status],
  );

  useEffect(() => {
    void loadItems(1);
  }, [loadItems]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setKeyword(keywordInput.trim());
  }

  const columns: DataTableColumn<SolutionItem>[] =
    useMemo(
      () => [
        {
          key: "name",
          label: "名称",
          render: (item) => (
            <div>
              <div className="font-semibold text-slate-900">
                {item.name}
              </div>
              {item.translationKey ? (
                <div className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400">
                  <Languages className="h-3.5 w-3.5" />
                  {item.translationKey}
                </div>
              ) : null}
            </div>
          ),
        },
        {
          key: "locale",
          label: "语言",
          render: (item) => (
            <span className="text-sm">
              {item.locale === "zh"
                ? "中文"
                : "English"}
            </span>
          ),
        },
        {
          key: "slug",
          label: "Slug",
          render: (item) => (
            <p className="font-mono text-xs text-slate-500">
              {item.slug}
            </p>
          ),
        },
        {
          key: "status",
          label: "状态",
          render: (item) => (
            <span
              className={
                item.status === "PUBLISHED"
                  ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
              }
            >
              {item.status === "PUBLISHED"
                ? "已发布"
                : "草稿"}
            </span>
          ),
        },
        {
          key: "sortOrder",
          label: "排序",
          render: (item) => (
            <p className="text-sm">
              {item.sortOrder}
            </p>
          ),
        },
        {
          key: "counts",
          label: "子项",
          render: (item) => (
            <p className="text-sm text-slate-500">
              场景 {item.counts.usageScenarios} /
              价值 {item.counts.customerValues}
            </p>
          ),
        },
        {
          key: "dates",
          label: "发布/更新",
          render: (item) => (
            <div className="text-xs leading-6 text-slate-500">
              <div>发布：{formatDate(item.publishedAt)}</div>
              <div>更新：{formatDate(item.updatedAt)}</div>
            </div>
          ),
        },
        {
          key: "actions",
          label: "操作",
          className: "px-5 py-4 text-right",
          render: (item) => (
            <div className="flex flex-wrap justify-end gap-2">
              {!deleted ? (
                <>
                  <Link
                    href={`/admin/solutions/${item.id}/edit`}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    编辑
                  </Link>
                  {item.status === "PUBLISHED" ? (
                    <Link
                      href={item.detailUrl}
                      target="_blank"
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      公开页
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    disabled={
                      mutatingId === item.id
                    }
                    onClick={() =>
                      void mutateSolution(
                        item,
                        "delete",
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    删除
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={
                    mutatingId === item.id
                  }
                  onClick={() =>
                    void mutateSolution(
                      item,
                      "restore",
                    )
                  }
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-200 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  恢复
                </button>
              )}
            </div>
          ),
        },
      ],
      [deleted, mutatingId],
    );

  async function mutateSolution(item: SolutionItem, action: "delete" | "restore") {
    if (mutatingId) {
      return;
    }

    const confirmed =
      action === "delete"
        ? window.confirm(`确认删除「${item.name}」？`)
        : window.confirm(`确认恢复「${item.name}」？`);

    if (!confirmed) {
      return;
    }

    setMutatingId(item.id);
    setError("");

    try {
      const response = await fetch(
        action === "delete"
          ? `/api/admin/solutions/${item.id}`
          : `/api/admin/solutions/${item.id}/restore`,
        {
          method: action === "delete" ? "DELETE" : "POST",
          credentials: "include",
        },
      );
      const result = (await response.json()) as MutateResponse;

      if (!response.ok || !result.success) {
        throw new Error(getErrorMessage(result));
      }

      await loadItems(pagination.page);
    } catch (mutateError) {
      setError(
        mutateError instanceof Error ? mutateError.message : "操作失败",
      );
    } finally {
      setMutatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Solutions
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            解决方案管理
          </h1>
        </div>
        <Link
          href="/admin/solutions/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新建解决方案
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-5"
        >
          <label className="relative block sm:col-span-2 lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={keywordInput}
              onChange={(event) =>
                setKeywordInput(event.target.value)
              }
              placeholder="搜索名称或 Slug"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="relative block">
            <select
              value={locale}
              onChange={(event) =>
                setLocale(
                  event.target.value === "ALL"
                    ? "ALL"
                    : event.target.value === "en"
                      ? "en"
                      : "zh",
                )
              }
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="ALL">全部语言</option>
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </label>

          <label className="relative block">
            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value === "ALL"
                    ? "ALL"
                    : event.target.value === "PUBLISHED"
                      ? "PUBLISHED"
                      : "DRAFT",
                )
              }
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="ALL">全部状态</option>
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">已发布</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </label>

          <label className="relative block">
            <select
              value={deleted ? "true" : "false"}
              onChange={(event) =>
                setDeleted(event.target.value === "true")
              }
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="false">正常数据</option>
              <option value="true">回收站</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </label>

          <button
            type="button"
            onClick={() =>
              void loadItems(pagination.page)
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </form>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <DataTable
          data={items}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="暂无解决方案"
          pagination={pagination}
          onPageChange={loadItems}
        />
      </section>
    </div>
  );
}
