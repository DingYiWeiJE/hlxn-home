"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const [pagination, setPagination] = useState({
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
          data?: { users: User[]; pagination: typeof pagination };
        };
        const result = data.data;

        if (result?.users) {
          setUsers(result.users);
          setPagination(result.pagination);
        }
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [router, page, search]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center text-slate-600">加载中...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">用户管理</h1>
        <Link href="/admin/users/create" className="rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700">
          创建用户
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="搜索用户名或邮箱..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">用户名</th>
                <th className="px-4 py-3">邮箱</th>
                <th className="px-4 py-3">角色</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">最后登录</th>
                <th className="px-4 py-3">创建时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{user.username}</td>
                  <td className="px-4 py-3">{user.email || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${roleBadgeColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={user.isActive ? "text-green-600" : "text-red-600"}>
                      {user.isActive ? "活跃" : "已禁用"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/users/${user.id}/edit`} className="text-blue-600 hover:text-blue-700">
                        编辑
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-12 text-center text-slate-500">
          未找到用户
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          共 {pagination.total} 个用户，第 {page} / {pagination.totalPages} 页
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={!pagination.hasPreviousPage}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            上一页
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!pagination.hasNextPage}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            下一页
          </button>
        </div>
      </div>
    </main>
  );
}
