"use client";

import {
  Edit3,
  FileText,
  FolderTree,
  ImageIcon,
  Languages,
  Loader2,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export type ProductLocale = "zh" | "en";

export type ProductStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "OFFLINE";

export type ProductItem = {
  id: string;
  locale: ProductLocale;
  name: string;
  slug: string;
  seriesName: string | null;
  status: ProductStatus;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  category: {
    primary: {
      id: string;
      name: string;
      slug: string;
    } | null;

    secondary: {
      id: string;
      name: string;
      slug: string;
    };
  };

  coverImage: {
    id: string;
    url: string;
    originalName: string | null;
    width: number | null;
    height: number | null;
    alt: string | null;
  } | null;

  detailPdf: {
    id: string;
    originalName: string | null;
    size: number;
    downloadUrl: string;
  } | null;

  counts: {
    advantages: number;
    applications: number;
  };
};

export function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "zh-CN",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

export function formatFileSize(
  bytes: number,
): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

export function getStatusLabel(
  status: ProductStatus,
) {
  if (status === "PUBLISHED") {
    return "已发布";
  }

  if (status === "OFFLINE") {
    return "已下线";
  }

  return "草稿";
}

export function getStatusClassName(
  status: ProductStatus,
) {
  if (status === "PUBLISHED") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "OFFLINE") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-amber-50 text-amber-700";
}

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

interface ProductsTableProps {
  products: ProductItem[];
  isLoading: boolean;
  deletingId: string | null;
  pagination: Pagination;
  onDelete: (product: ProductItem) => void;
  onPageChange: (page: number) => void;
}

export function ProductsTable({
  products,
  isLoading,
  deletingId,
  pagination,
  onDelete,
  onPageChange,
}: ProductsTableProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          正在加载产品列表
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center px-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <ImageIcon className="h-8 w-8" />
        </div>

        <h2 className="mt-4 text-base font-semibold text-slate-800">
          暂无符合条件的产品
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          可以调整筛选条件或创建第一个产品。
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-4">产品</th>
              <th className="px-5 py-4">语言</th>
              <th className="px-5 py-4">分类</th>
              <th className="px-5 py-4">内容</th>
              <th className="px-5 py-4">PDF</th>
              <th className="px-5 py-4">状态</th>
              <th className="px-5 py-4">
                更新时间
              </th>
              <th className="px-5 py-4 text-right">
                操作
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {products.map((product) => (
              <tr
                key={product.id}
                className="transition hover:bg-slate-50/80"
              >
                <td className="px-5 py-4">
                  <div className="flex min-w-[280px] items-center gap-4">
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      {product.coverImage ? (
                        <Image
                          src={
                            product.coverImage.url
                          }
                          alt={
                            product.coverImage
                              .alt || product.name
                          }
                          fill
                          unoptimized
                          sizes="80px"
                          className="object-contain p-1.5"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="block truncate text-sm font-semibold text-slate-950 transition hover:text-blue-600"
                      >
                        {product.name}
                      </Link>

                      {product.seriesName ? (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {product.seriesName}
                        </p>
                      ) : null}

                      <p className="mt-1 truncate font-mono text-xs text-slate-400">
                        {product.slug}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                      product.locale === "zh"
                        ? "bg-red-50 text-red-700"
                        : "bg-blue-50 text-blue-700",
                    ].join(" ")}
                  >
                    <Languages className="h-3.5 w-3.5" />

                    {product.locale === "zh"
                      ? "中文"
                      : "英文"}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="min-w-[180px] text-sm">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <FolderTree className="h-4 w-4 text-slate-400" />

                      {product.category.primary
                        ?.name ?? "—"}
                    </div>

                    <p className="mt-1 pl-5 text-xs text-slate-500">
                      {
                        product.category.secondary
                          .name
                      }
                    </p>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>
                      产品优势：
                      {product.counts.advantages}
                    </p>

                    <p>
                      应用场景：
                      {product.counts.applications}
                    </p>
                  </div>
                </td>

                <td className="px-5 py-4">
                  {product.detailPdf ? (
                    <div className="min-w-[150px]">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-violet-700">
                        <FileText className="h-4 w-4" />
                        已上传
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatFileSize(
                          product.detailPdf.size,
                        )}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">
                      未上传
                    </span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                      getStatusClassName(
                        product.status,
                      ),
                    ].join(" ")}
                  >
                    {getStatusLabel(
                      product.status,
                    )}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="min-w-[150px] text-xs text-slate-500">
                    {formatDate(product.updatedAt)}
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      aria-label={`编辑 ${product.name}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        void onDelete(product)
                      }
                      disabled={
                        deletingId === product.id
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      aria-label={`删除 ${product.name}`}
                    >
                      {deletingId === product.id ? (
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

      <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          第 {pagination.page} 页，共{" "}
          {Math.max(
            pagination.totalPages,
            1,
          )}{" "}
          页，合计{" "}
          {pagination.total} 个产品
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={
              !pagination.hasPreviousPage
            }
            onClick={() =>
              void onPageChange(
                pagination.page - 1,
              )
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
              void onPageChange(
                pagination.page + 1,
              )
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      </div>
    </>
  );
}
