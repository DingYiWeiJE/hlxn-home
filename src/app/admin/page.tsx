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
  SUPER_ADMIN: "from-red-500 to-red-600",
  ADMIN: "from-blue-500 to-blue-600",
  EDITOR: "from-green-500 to-green-600",
  VIEWER: "from-gray-500 to-gray-600",
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
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">加载中...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 relative overflow-hidden">
      {/* Soft Color Washes - Like distant aurora/nebula */}
      <div className="absolute inset-0 opacity-40">
        {/* Top Left - Soft Mint Green */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-emerald-100/30 to-transparent rounded-full blur-3xl -ml-32 -mt-32"></div>

        {/* Top Right - Soft Pink */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-rose-100/30 to-transparent rounded-full blur-3xl -mr-32 -mt-32"></div>

        {/* Bottom Right - Soft Sky Blue */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-sky-100/30 to-transparent rounded-full blur-3xl -mr-32 -mb-32"></div>

        {/* Bottom Left - Hint of Pink */}
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-radial from-rose-100/20 to-transparent rounded-full blur-3xl -ml-32 -mb-32"></div>
      </div>

      {error && (
        <div className="fixed top-6 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-md z-50">
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Welcome Hero Section */}
        <div className="mb-12">
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${roleColors[user?.role || "VIEWER"]} p-8 sm:p-12 text-white shadow-lg`}>
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-40 -mt-40"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32"></div>

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-4xl">
                  👤
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-1">欢迎回来，{user?.username}！</h1>
                  <p className="text-white/90 text-lg">管理你的系统，保持一切井然有序</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                  角色: {roleLabels[user?.role || "VIEWER"]}
                </span>
                {user?.email && (
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                    {user.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">系统概览</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Total Users */}
              <div className="group relative rounded-xl bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 hover:border-blue-200">
                <div className="absolute top-6 right-6 text-4xl opacity-20">👥</div>
                <div className="relative z-10">
                  <p className="text-slate-600 text-sm font-medium mb-2">总用户数</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-blue-600">{stats.totalUsers}</span>
                    <span className="text-xs text-slate-500">用户</span>
                  </div>
                </div>
              </div>

              {/* Total News */}
              <div className="group relative rounded-xl bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 hover:border-purple-200">
                <div className="absolute top-6 right-6 text-4xl opacity-20">📰</div>
                <div className="relative z-10">
                  <p className="text-slate-600 text-sm font-medium mb-2">新闻总数</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-purple-600">{stats.totalNews}</span>
                    <span className="text-xs text-slate-500">篇</span>
                  </div>
                </div>
              </div>

              {/* Published */}
              <div className="group relative rounded-xl bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 hover:border-green-200">
                <div className="absolute top-6 right-6 text-4xl opacity-20">✅</div>
                <div className="relative z-10">
                  <p className="text-slate-600 text-sm font-medium mb-2">已发布</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-green-600">{stats.publishedNews}</span>
                    <span className="text-xs text-slate-500">篇</span>
                  </div>
                </div>
              </div>

              {/* Drafts */}
              <div className="group relative rounded-xl bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 hover:border-orange-200">
                <div className="absolute top-6 right-6 text-4xl opacity-20">📝</div>
                <div className="relative z-10">
                  <p className="text-slate-600 text-sm font-medium mb-2">草稿</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-orange-600">{stats.draftNews}</span>
                    <span className="text-xs text-slate-500">篇</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">快速操作</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Users Management */}
            <Link href="/admin/users" className="group block">
              <div className="relative rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 hover:border-blue-200 h-full">
                {/* Top accent bar */}
                <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>

                <div className="p-8">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-3xl group-hover:scale-110 transition-transform">
                    👥
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">用户管理</h3>
                  <p className="text-slate-600 text-sm mb-6">创建、编辑和管理系统用户账户，分配角色和权限</p>

                  <div className="inline-flex items-center gap-2 text-blue-600 font-medium text-sm group-hover:gap-3 transition-all">
                    <span>进入系统</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* News Management */}
            <Link href="/admin/news" className="group block">
              <div className="relative rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 hover:border-purple-200 h-full">
                <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>

                <div className="p-8">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-50 text-3xl group-hover:scale-110 transition-transform">
                    📰
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">新闻管理</h3>
                  <p className="text-slate-600 text-sm mb-6">创建、编辑、发布和管理新闻文章内容</p>

                  <div className="inline-flex items-center gap-2 text-purple-600 font-medium text-sm group-hover:gap-3 transition-all">
                    <span>进入系统</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Media Management - Coming Soon */}
            <div className="group block">
              <div className="relative rounded-xl overflow-hidden bg-slate-50 shadow-sm border border-slate-200 h-full opacity-60">
                <div className="h-1 bg-gradient-to-r from-gray-300 to-gray-400"></div>

                <div className="p-8">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-3xl">
                    🖼️
                  </div>
                  <h3 className="text-xl font-bold text-slate-600 mb-2">媒体管理</h3>
                  <p className="text-slate-500 text-sm mb-6">管理系统中的所有媒体资源和文件</p>

                  <div className="inline-flex items-center gap-2 text-slate-400 font-medium text-sm">
                    <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-semibold">即将推出</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Activity and Help Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="rounded-xl bg-white p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="text-xl">📊</span>
              最近活动
            </h3>
            <div className="text-center py-8">
              <div className="text-5xl mb-3">✨</div>
              <p className="text-slate-500 font-medium">暂无最近活动</p>
              <p className="text-slate-400 text-sm mt-2">活动日志将在这里显示</p>
            </div>
          </div>

          {/* Help & Tips */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8 border border-blue-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="text-xl">💡</span>
              快速提示
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold flex-shrink-0">→</span>
                <span className="text-slate-700"><strong>用户管理：</strong>管理系统用户、分配角色权限</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold flex-shrink-0">→</span>
                <span className="text-slate-700"><strong>新闻管理：</strong>发布和管理公司新闻内容</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold flex-shrink-0">→</span>
                <span className="text-slate-700"><strong>权限检查：</strong>仅超级管理员可访问用户管理</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
