"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit3, Search } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
  type DataTablePaginationProps,
} from "@/components/admin/DataTable";

type User = {
  id: string;
  username: string;
  email: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER";
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
};

const roleLabels = {
  SUPER_ADMIN: "超级管理员",
  ADMIN: "管理员",
  EDITOR: "编辑",
  VIEWER: "浏览者",
};

const roleBadgeColors = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN: "bg-blue-100 text-blue-700",
  EDITOR: "bg-green-100 text-green-700",
  VIEWER: "bg-gray-100 text-gray-700",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<DataTablePaginationProps>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const url = new URL("/api/admin/users", window.location.origin);
        url.searchParams.set("page", page.toString());
        if (search) url.searchParams.set("search", search);

        const response = await fetch(url.toString());
        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/admin/login");
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as {
          success: boolean;
          data?: {
            users: User[];
            pagination: DataTablePaginationProps;
          };
        };
        const result = data.data;

        if (result?.users) {
          setUsers(result.users);
          setPagination(result.pagination);
        }
        setError("");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "加载失败",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadUsers();
  }, [router, page, search]);

  const columns: DataTableColumn<User>[] =
    useMemo(
      () => [
        {
          key: "username",
          label: "用户名",
          render: (user) => (
            <div>
              <p className="font-medium text-slate-900">
                {user.username}
              </p>

              {user.email && (
                <p className="mt-1 text-sm text-slate-500">
                  {user.email}
                </p>
              )}
            </div>
          ),
        },
        {
          key: "role",
          label: "角色",
          render: (user) => (
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                roleBadgeColors[user.role]
              }`}
            >
              {roleLabels[user.role]}
            </span>
          ),
        },
        {
          key: "status",
          label: "状态",
          render: (user) => (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                user.isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  user.isActive
                    ? "bg-emerald-500"
                    : "bg-slate-400"
                }`}
              />
              {user.isActive
                ? "启用"
                : "禁用"}
            </span>
          ),
        },
        {
          key: "lastLogin",
          label: "最后登录",
          render: (user) => (
            <p className="text-sm text-slate-600">
              {user.lastLogin
                ? new Date(
                    user.lastLogin,
                  ).toLocaleDateString(
                    "zh-CN",
                  )
                : "—"}
            </p>
          ),
        },
        {
          key: "createdAt",
          label: "创建时间",
          render: (user) => (
            <p className="text-sm text-slate-600">
              {new Date(
                user.createdAt,
              ).toLocaleDateString(
                "zh-CN",
              )}
            </p>
          ),
        },
        {
          key: "actions",
          label: "操作",
          className: "px-4 py-3 text-right",
          render: (user) => (
            <div className="flex justify-end gap-2">
              <Link
                href={`/admin/users/${user.id}/edit`}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-blue-600 hover:bg-blue-50"
              >
                <Edit3 className="h-4 w-4" />
              </Link>
            </div>
          ),
        },
      ],
      [],
    );

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center text-slate-600">
          加载中...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">
          用户管理
        </h1>

        <Link
          href="/admin/users/create"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          创建用户
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索用户名或邮箱..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <DataTable
          data={users}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="暂无用户"
          pagination={pagination}
          onPageChange={setPage}
        />
      </div>
    </main>
  );
}
