"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FilePenLine,
  Layers3,
  Loader2,
  Newspaper,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

const roleLabels: Record<CurrentUser["role"], string> = {
  SUPER_ADMIN: "超级管理员",
  ADMIN: "管理员",
  EDITOR: "内容编辑",
  VIEWER: "只读用户",
};

const roleStyles: Record<CurrentUser["role"], string> = {
  SUPER_ADMIN: "border-rose-200 bg-rose-50 text-rose-700",
  ADMIN: "border-blue-200 bg-blue-50 text-blue-700",
  EDITOR: "border-emerald-200 bg-emerald-50 text-emerald-700",
  VIEWER: "border-slate-200 bg-slate-100 text-slate-700",
};

const quickActions = [
  {
    href: "/admin/news/create",
    title: "发布新闻",
    description: "新建企业动态与行业资讯",
    icon: Newspaper,
    iconClassName: "bg-blue-600 text-white",
  },
  {
    href: "/admin/products/create",
    title: "添加产品",
    description: "完善产品资料与展示信息",
    icon: Package,
    iconClassName: "bg-emerald-600 text-white",
  },
  {
    href: "/admin/application-cases/new",
    title: "创建案例",
    description: "沉淀项目成果与实践经验",
    icon: BookOpen,
    iconClassName: "bg-amber-500 text-white",
  },
  {
    href: "/admin/contact-submissions",
    title: "查看线索",
    description: "跟进客户提交的联系表单",
    icon: ClipboardList,
    iconClassName: "bg-violet-600 text-white",
  },
];

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: typeof Users;
  iconClassName: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconClassName}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">{detail}</p>
    </section>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const sessionResponse = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        if (!sessionResponse.ok) {
          router.replace("/admin/login");
          return;
        }

        const sessionData = (await sessionResponse.json()) as {
          success: boolean;
          data?: { authenticated?: boolean; user?: CurrentUser };
        };

        if (!sessionData.data?.authenticated || !sessionData.data.user) {
          router.replace("/admin/login");
          return;
        }

        if (!cancelled) {
          setUser(sessionData.data.user);
        }

        const statsResponse = await fetch("/api/admin/stats", {
          cache: "no-store",
        });

        if (!statsResponse.ok) {
          throw new Error("暂时无法加载仪表盘数据，请稍后重试。");
        }

        const statsData = (await statsResponse.json()) as {
          success: boolean;
          data?: DashboardStats;
        };

        if (!statsData.success || !statsData.data) {
          throw new Error("暂时无法加载仪表盘数据，请稍后重试。");
        }

        if (!cancelled) {
          setStats(statsData.data);
        }
      } catch (loadError) {
        console.error("Load dashboard failed:", loadError);

        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "加载仪表盘失败，请稍后重试。",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const publishRate = useMemo(() => {
    if (!stats?.totalNews) {
      return 0;
    }

    return Math.round((stats.publishedNews / stats.totalNews) * 100);
  }, [stats]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          正在加载仪表盘
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              内容管理中心
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
              早上好，{user?.username ?? "管理员"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              在这里查看内容运营概况，并快速开始今天的工作。
            </p>
          </div>

          {user ? (
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${roleStyles[user.role]}`}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {roleLabels[user.role]}
              </span>
              <Link
                href="/admin/news/create"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                新建内容
              </Link>
            </div>
          ) : null}
        </header>

        {error ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        ) : null}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="系统用户"
            value={stats?.totalUsers ?? "-"}
            detail="拥有后台访问权限的账号"
            icon={Users}
            iconClassName="bg-blue-50 text-blue-700"
          />
          <StatCard
            label="新闻内容"
            value={stats?.totalNews ?? "-"}
            detail="已创建的全部新闻条目"
            icon={Newspaper}
            iconClassName="bg-violet-50 text-violet-700"
          />
          <StatCard
            label="已发布新闻"
            value={stats?.publishedNews ?? "-"}
            detail="正在官网展示的新闻内容"
            icon={CheckCircle2}
            iconClassName="bg-emerald-50 text-emerald-700"
          />
          <StatCard
            label="待完善草稿"
            value={stats?.draftNews ?? "-"}
            detail="尚未发布，等待编辑处理"
            icon={FilePenLine}
            iconClassName="bg-amber-50 text-amber-700"
          />
        </section>

        <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">快捷操作</h2>
                <p className="mt-1 text-sm text-slate-500">
                  常用内容管理入口
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex min-h-32 items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${action.iconClassName}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold text-slate-900">
                        {action.title}
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-slate-500">
                        {action.description}
                      </span>
                    </span>
                    <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
                  </Link>
                );
              })}
            </div>
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">内容状态</h2>
                <p className="mt-1 text-sm text-slate-500">新闻发布进度</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Layers3 className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-7">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-semibold text-slate-950">
                  {publishRate}%
                </span>
                <span className="text-sm text-slate-500">新闻已发布</span>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                aria-label={`新闻发布率 ${publishRate}%`}
              >
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${publishRate}%` }}
                />
              </div>
            </div>

            <dl className="mt-7 space-y-4 border-t border-slate-100 pt-5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">已发布</dt>
                <dd className="font-semibold text-slate-900">
                  {stats?.publishedNews ?? 0} 篇
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">草稿待处理</dt>
                <dd className="font-semibold text-slate-900">
                  {stats?.draftNews ?? 0} 篇
                </dd>
              </div>
            </dl>

            <Link
              href="/admin/news"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
            >
              管理新闻内容
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
