"use client";

import {
  Edit3,
  Loader2,
  Trash2,
} from "lucide-react";

export type CategoryLevel = "LEVEL_ONE" | "LEVEL_TWO";

export type CategoryItem = {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  level: CategoryLevel;
  parentId: string | null;
  parent: {
    id: string;
    name: string;
    nameEn: string;
    slug: string;
  } | null;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  counts: {
    children: number;
    products: number;
  };
};

interface CategoriesTableProps {
  categories: CategoryItem[];
  isLoading: boolean;
  deletingId: string | null;
  onEdit: (category: CategoryItem) => void;
  onDelete: (category: CategoryItem) => void;
}

export function CategoriesTable({
  categories,
  isLoading,
  deletingId,
  onEdit,
  onDelete,
}: CategoriesTableProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          正在加载产品分类
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center px-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <svg
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4m0 0v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7"
            />
          </svg>
        </div>

        <h2 className="mt-4 text-base font-semibold text-slate-800">
          暂无符合条件的分类
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          可以调整筛选条件或创建新的产品分类。
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-5 py-4">分类</th>
            <th className="px-5 py-4">层级</th>
            <th className="px-5 py-4">所属一级分类</th>
            <th className="px-5 py-4">关联内容</th>
            <th className="px-5 py-4">排序</th>
            <th className="px-5 py-4">状态</th>
            <th className="px-5 py-4 text-right">操作</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {categories.map((category) => (
            <tr
              key={category.id}
              className="transition hover:bg-slate-50/80"
            >
              <td className="px-5 py-4">
                <div className="font-semibold text-slate-900">
                  {category.name}
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  {category.nameEn}
                </div>

                <div className="mt-1 font-mono text-xs text-slate-400">
                  {category.slug}
                </div>
              </td>

              <td className="px-5 py-4">
                <span
                  className={[
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                    category.level === "LEVEL_ONE"
                      ? "bg-violet-50 text-violet-700"
                      : "bg-blue-50 text-blue-700",
                  ].join(" ")}
                >
                  {category.level === "LEVEL_ONE"
                    ? "一级分类"
                    : "二级分类"}
                </span>
              </td>

              <td className="px-5 py-4 text-sm text-slate-600">
                {category.parent?.name ?? "—"}
              </td>

              <td className="px-5 py-4">
                <div className="text-sm text-slate-700">
                  {category.level === "LEVEL_ONE"
                    ? `${category.counts.children} 个二级分类`
                    : `${category.counts.products} 个产品`}
                </div>
              </td>

              <td className="px-5 py-4 text-sm tabular-nums text-slate-600">
                {category.sortOrder}
              </td>

              <td className="px-5 py-4">
                <span
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    category.enabled
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "h-1.5 w-1.5 rounded-full",
                      category.enabled
                        ? "bg-emerald-500"
                        : "bg-slate-400",
                    ].join(" ")}
                  />

                  {category.enabled ? "启用" : "停用"}
                </span>
              </td>

              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(category)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    aria-label={`编辑 ${category.name}`}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(category)}
                    disabled={
                      deletingId === category.id
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    aria-label={`删除 ${category.name}`}
                  >
                    {deletingId === category.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
