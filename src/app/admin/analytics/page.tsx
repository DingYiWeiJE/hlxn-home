"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Loader2, TrendingUp } from "lucide-react";
import ReactECharts from "echarts-for-react";

type DatePreset = "today" | "week" | "month" | "custom";
type GroupBy = "day" | "week" | "month";

interface DashboardData {
  range: {
    start: string;
    end: string;
    groupBy: GroupBy;
    preset: string;
  };
  websiteVisits: number;
  contactViews: number;
  visitTrend: Array<{ date: string; value: number }>;
  topProducts: Array<{ id: string; name: string; slug: string; views: number }>;
  topNews: Array<{ id: string; title: string; slug: string; views: number }>;
  topSolutions: Array<{ id: string; name: string; slug: string; views: number }>;
  topCases: Array<{ id: string; title: string; slug: string; views: number }>;
}

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
  loading,
}: {
  title: string;
  columns: string[];
  data: Array<any>;
  loading: boolean;
}) {
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
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  暂无数据
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-100 hover:bg-slate-50"
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryParams = useMemo(() => {
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

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/analytics/dashboard?${queryParams}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Failed to load analytics data");
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error?.message || "Unknown error");
      }
    } catch (err) {
      console.error("Load dashboard error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load analytics data",
      );
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const chartOption = useMemo(() => {
    if (!data?.visitTrend) {
      return null;
    }

    return {
      responsive: true,
      maintainAspectRatio: true,
      grid: { left: 60, right: 20, bottom: 40, top: 20 },
      xAxis: {
        type: "category",
        data: data.visitTrend.map((d) => d.date),
        boundaryGap: false,
      },
      yAxis: {
        type: "value",
        minInterval: 1,
      },
      series: [
        {
          data: data.visitTrend.map((d) => d.value),
          type: "line",
          smooth: true,
          itemStyle: { color: "#2563eb" },
          lineStyle: { color: "#2563eb", width: 2 },
          areaStyle: { color: "rgba(37, 99, 235, 0.1)" },
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
    };
  }, [data?.visitTrend]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-950">访问统计</h1>
          <p className="mt-2 text-sm text-slate-500">
            实时查看官网访问数据和内容人气排行
          </p>
        </header>

        {/* 时间范围选择 */}
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

          {/* 自定义日期范围 */}
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

          {/* 聚合粒度选择 */}
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

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              加载统计数据中...
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* KPI 卡片 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label="官网访问次数"
                value={data.websiteVisits}
                icon={TrendingUp}
              />
              <StatCard
                label="联系我们访问"
                value={data.contactViews}
                icon={TrendingUp}
              />
            </div>

            {/* 访问趋势图 */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-950">官网访问趋势</h2>
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
                data={data.topProducts}
                loading={false}
              />
              <TopTable
                title="新闻访问量 TOP 10"
                columns={["排名", "新闻标题", "访问次数"]}
                data={data.topNews}
                loading={false}
              />
              <TopTable
                title="解决方案访问量 TOP 10"
                columns={["排名", "方案名称", "访问次数"]}
                data={data.topSolutions}
                loading={false}
              />
              <TopTable
                title="应用案例访问量 TOP 10"
                columns={["排名", "案例标题", "访问次数"]}
                data={data.topCases}
                loading={false}
              />
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
