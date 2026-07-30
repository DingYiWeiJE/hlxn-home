"use client";

import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  className?: string;
}

export interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  isLoading: boolean;
  emptyMessage?: string;
  pagination?: DataTablePaginationProps;
  onPageChange?: (page: number) => void;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  isLoading,
  emptyMessage = "暂无数据",
  pagination,
  onPageChange,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          加载中...
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={
                    column.className ||
                    "px-5 py-4"
                  }
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((item) => (
              <tr
                key={item.id}
                className="transition hover:bg-slate-50/80"
              >
                {columns.map((column) => (
                  <td
                    key={`${item.id}-${column.key}`}
                    className={
                      column.className ||
                      "px-5 py-4"
                    }
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && onPageChange ? (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            第 {pagination.page} 页，共{" "}
            {Math.max(
              pagination.totalPages,
              1,
            )}{" "}
            页，合计 {pagination.total} 项
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={
                !pagination.hasPreviousPage
              }
              onClick={() =>
                onPageChange(pagination.page - 1)
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              上一页
            </button>

            <button
              type="button"
              disabled={
                !pagination.hasNextPage
              }
              onClick={() =>
                onPageChange(pagination.page + 1)
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
