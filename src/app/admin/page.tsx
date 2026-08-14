"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ClipboardList,
  Loader2,
  Newspaper,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";

type CurrentUser = {
  id: string;
  username: string;
  email: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER";
};

type DatePreset = "today" | "week" | "month" | "custom";
type GroupBy = "day" | "week" | "month";

interface AnalyticsDashboardData {
  range: {
    start: string;
    end: string;
    groupBy: GroupBy;
    preset: string;
  };
  websiteVisits: number;
  contactViews: number;
  visitTrend: Array<{ date: string; websiteVisits: number; contactVisits: number }>;
  topProducts: Array<{ id: string; name: string; slug: string; views: number }>;
  topNews: Array<{ id: string; title: string; slug: string; views: number }>;
  topSolutions: Array<{ id: string; name: string; slug: string; views: number }>;
  topCases: Array<{ id: string; title: string; slug: string; views: number }>;
}

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
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof TrendingUp;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
          <Icon className="h-6 w-6 text-blue-600" />
        </span>
      </div>
    </div>
  );
}

function TopTable({
  title,
  columns,
  data,
  resourceType,
}: {
  title: string;
  columns: string[];
  data: Array<any>;
  resourceType?: "product" | "news" | "solution" | "case";
}) {
  const getDetailUrl = (row: any) => {
    if (!resourceType || !row.slug) return null;

    const locale = "zh"; // 使用中文 locale
    switch (resourceType) {
      case "product":
        return `/${locale}/products/${row.slug}`;
      case "news":
        return `/${locale}/news/${row.slug}`;
      case "solution":
        return `/${locale}/solutions/${row.slug}`;
      case "case":
        return `/${locale}/application-cases/${row.slug}`;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="font-semibold text-slate-950">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-sm font-medium text-slate-600"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  暂无数据
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const url = getDetailUrl(row);
                return (
                  <tr
                    key={idx}
                    onClick={() => {
                      if (url) {
                        window.open(url, "_blank");
                      }
                    }}
                    className={`border-b border-slate-100 ${
                      url
                        ? "cursor-pointer transition hover:bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-slate-950">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-950">
                      {row.name || row.title}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                      {row.views}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Analytics state
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [analyticsData, setAnalyticsData] =
    useState<AnalyticsDashboardData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const analyticsQueryParams = useMemo(() => {
    let params: Record<string, string> = { groupBy };

    if (datePreset === "custom" && customStart && customEnd) {
      params.preset = "custom";
      params.startDate = customStart;
      params.endDate = customEnd;
    } else {
      params.preset = datePreset;
    }

    return new URLSearchParams(params);
  }, [datePreset, groupBy, customStart, customEnd]);

  // Load user session
  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
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
      } catch (err) {
        console.error("Load session failed:", err);
        if (!cancelled) {
          router.replace("/admin/login");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);

    try {
      const response = await fetch(
        `/api/admin/analytics/dashboard?${analyticsQueryParams}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Failed to load analytics data");
      }

      const result = await response.json();

      if (result.success && result.data) {
        setAnalyticsData(result.data);
      } else {
        throw new Error(result.error?.message || "Unknown error");
      }
    } catch (err) {
      console.error("Load analytics error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load analytics data",
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsQueryParams]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const chartOption = useMemo(() => {
    if (!analyticsData?.visitTrend) {
      return null;
    }

    return {
      responsive: true,
      maintainAspectRatio: true,
      grid: { left: 60, right: 20, bottom: 40, top: 20 },
      xAxis: {
        type: "category",
        data: analyticsData.visitTrend.map((d) => d.date),
        boundaryGap: false,
      },
      yAxis: {
        type: "value",
        minInterval: 1,
      },
      series: [
        {
          name: "官网访问",
          data: analyticsData.visitTrend.map((d) => d.websiteVisits),
          type: "line",
          smooth: true,
          itemStyle: { color: "#2563eb" },
          lineStyle: { color: "#2563eb", width: 2 },
          areaStyle: { color: "rgba(37, 99, 235, 0.1)" },
          symbol: "circle",
          symbolSize: 4,
        },
        {
          name: "联系我们",
          data: analyticsData.visitTrend.map((d) => d.contactVisits),
          type: "line",
          smooth: true,
          itemStyle: { color: "#dc2626" },
          lineStyle: { color: "#dc2626", width: 2 },
          areaStyle: { color: "rgba(220, 38, 38, 0.1)" },
          symbol: "circle",
          symbolSize: 4,
        },
      ],
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "transparent",
        textStyle: { color: "#fff" },
      },
      legend: {
        data: ["官网访问", "联系我们"],
        top: 0,
        textStyle: { color: "#64748b" },
      },
    };
  }, [analyticsData?.visitTrend]);

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
        {/* 页面标题 */}
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
              在这里查看官网访问数据和快速开始今天的工作。
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

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mt-7 space-y-7">
          {/* 快捷操作 */}
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

          {/* 访问统计 */}
          <section>
            <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">
                    时间范围：
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["today", "week", "month"] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setDatePreset(preset);
                        setGroupBy(preset === "month" ? "month" : "day");
                      }}
                      className={`rounded px-3 py-2 text-sm font-medium transition ${
                        datePreset === preset
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {{
                        today: "今日",
                        week: "本周",
                        month: "本月",
                      }[preset]}
                    </button>
                  ))}

                  <button
                    onClick={() => setDatePreset("custom")}
                    className={`rounded px-3 py-2 text-sm font-medium transition ${
                      datePreset === "custom"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    自定义
                  </button>
                </div>
              </div>

              {datePreset === "custom" && (
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end">
                  <div>
                    <label className="text-sm text-slate-600">开始日期</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="mt-1 rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">结束日期</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="mt-1 rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
                <span className="text-sm font-medium text-slate-700">
                  聚合粒度：
                </span>
                <div className="flex gap-2">
                  {(["day", "week", "month"] as const).map((grain) => (
                    <button
                      key={grain}
                      onClick={() => setGroupBy(grain)}
                      className={`rounded px-3 py-1 text-sm transition ${
                        groupBy === grain
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {grain === "day" ? "日" : grain === "week" ? "周" : "月"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="flex justify-center py-12">
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  加载统计数据中...
                </div>
              </div>
            ) : analyticsData ? (
              <div className="space-y-6">
                {/* KPI 卡片 */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard
                    label="官网访问次数"
                    value={analyticsData.websiteVisits}
                    icon={TrendingUp}
                  />
                  <StatCard
                    label="联系我们访问"
                    value={analyticsData.contactViews}
                    icon={TrendingUp}
                  />
                </div>

                {/* 访问趋势对比 */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 font-semibold text-slate-950">
                    访问趋势对比
                  </h2>
                  {chartOption && (
                    <ReactECharts
                      option={chartOption}
                      style={{ height: "300px", width: "100%" }}
                    />
                  )}
                </div>

                {/* TOP 10 表格 */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <TopTable
                    title="产品访问量 TOP 10"
                    columns={["排名", "产品名称", "访问次数"]}
                    data={analyticsData.topProducts}
                    resourceType="product"
                  />
                  <TopTable
                    title="新闻访问量 TOP 10"
                    columns={["排名", "新闻标题", "访问次数"]}
                    data={analyticsData.topNews}
                    resourceType="news"
                  />
                  <TopTable
                    title="解决方案访问量 TOP 10"
                    columns={["排名", "方案名称", "访问次数"]}
                    data={analyticsData.topSolutions}
                    resourceType="solution"
                  />
                  <TopTable
                    title="应用案例访问量 TOP 10"
                    columns={["排名", "案例标题", "访问次数"]}
                    data={analyticsData.topCases}
                    resourceType="case"
                  />
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
