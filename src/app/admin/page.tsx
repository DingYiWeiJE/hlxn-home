"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type DashboardStats = {
  totalUsers: number;
  totalNews: number;
  publishedNews: number;
  draftNews: number;
};

type CurrentUser = {
  id: string;
  username: string;
  email: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER";
};

const roleLabels = {
  SUPER_ADMIN: "超级管理员",
  ADMIN: "管理员",
  EDITOR: "编辑",
  VIEWER: "浏览者",
};

const roleColors = {
  SUPER_ADMIN: "text-red-700 bg-red-100",
  ADMIN: "text-blue-700 bg-blue-100",
  EDITOR: "text-green-700 bg-green-100",
  VIEWER: "text-gray-700 bg-gray-100",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Check session and get current user
        const sessionResponse = await fetch("/api/auth/session");
        if (!sessionResponse.ok) {
          router.replace("/admin/login");
          return;
        }

        const sessionData = (await sessionResponse.json()) as {
          success: boolean;
          data?: { authenticated: boolean; user: CurrentUser };
        };

        if (!sessionData.data?.authenticated) {
          router.replace("/admin/login");
          return;
        }

        setUser(sessionData.data.user);

        // Load dashboard stats
        const statsResponse = await fetch("/api/admin/stats");
        if (statsResponse.ok) {
          const statsData = (await statsResponse.json()) as {
            success: boolean;
            data?: DashboardStats;
          };
          if (statsData.data) {
            setStats(statsData.data);
          }
        }
      } catch (err) {
        console.error("Load dashboard failed:", err);
        setError(err instanceof Error ? err.message : "加载仪表板失败");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center text-slate-600">加载中...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Welcome Section */}
      <div className="mb-12">
        <div className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 p-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">
            欢迎回来，{user?.username}! 👋
          </h1>
          <p className="text-slate-600">
            角色: <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${roleColors[user?.role || "VIEWER"]}`}>
              {roleLabels[user?.role || "VIEWER"]}
            </span>
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="mb-12 grid gap-6 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-600">总用户数</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{stats.totalUsers}</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-600">新闻总数</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{stats.totalNews}</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-600">已发布</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{stats.publishedNews}</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-600">草稿</div>
            <div className="mt-2 text-3xl font-bold text-orange-600">{stats.draftNews}</div>
          </div>
        </div>
      )}

      {/* Quick Access Cards */}
      <div className="mb-12">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">快速访问</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Users Management */}
          <Link href="/admin/users" className="group">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-blue-300">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="mb-2 font-semibold text-slate-900 group-hover:text-blue-600">用户管理</h3>
              <p className="text-sm text-slate-600">创建、编辑和管理系统用户账户</p>
              <div className="mt-4 flex items-center text-sm text-blue-600 opacity-0 transition group-hover:opacity-100">
                进入 →
              </div>
            </div>
          </Link>

          {/* News Management */}
          <Link href="/admin/news" className="group">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-green-300">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <span className="text-2xl">📰</span>
              </div>
              <h3 className="mb-2 font-semibold text-slate-900 group-hover:text-green-600">新闻管理</h3>
              <p className="text-sm text-slate-600">创建、编辑和发布新闻文章</p>
              <div className="mt-4 flex items-center text-sm text-green-600 opacity-0 transition group-hover:opacity-100">
                进入 →
              </div>
            </div>
          </Link>

          {/* Media Management */}
          <div className="group">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-purple-300 opacity-50 cursor-not-allowed">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <span className="text-2xl">🖼️</span>
              </div>
              <h3 className="mb-2 font-semibold text-slate-900">媒体管理</h3>
              <p className="text-sm text-slate-600">即将推出</p>
              <div className="mt-4 flex items-center text-sm text-purple-600">
                开发中
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities - Placeholder */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">最近活动</h2>
        <p className="text-center text-slate-500">暂无最近活动</p>
      </div>

      {/* Help & Documentation */}
      <div className="mt-12 rounded-lg bg-slate-50 p-6">
        <h3 className="mb-4 font-semibold text-slate-900">需要帮助？</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>• 查看用户文档了解如何管理用户和设置权限</li>
          <li>• 访问新闻管理系统发布和管理内容</li>
          <li>• 联系管理员解决任何技术问题</li>
        </ul>
      </div>
    </main>
  );
}
