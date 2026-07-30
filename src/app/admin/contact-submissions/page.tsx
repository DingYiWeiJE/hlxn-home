"use client";

import {
  ChevronDown,
  Filter,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Eye,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DataTable,
  type DataTableColumn,
  type DataTablePaginationProps,
} from "@/components/admin/DataTable";

type Submission = {
  id: string;
  type: string;
  locale: string;
  contactName: string;
  phone: string | null;
  email: string | null;
  status: string;
  riskLevel: string;
  isDuplicate: boolean;
  notificationStatus: string;
  submittedAt: string;
  customerInquiry?: { companyName: string } | null;
  mediaInquiry?: { mediaName: string } | null;
  eventOrganizerInquiry?: { organizerName: string } | null;
};

type ApiResponse = {
  success: boolean;
  data?: {
    items: Submission[];
    pagination: DataTablePaginationProps;
  };
  error?: {
    code: string;
    message: string;
  };
};

const typeLabels: Record<string, string> = {
  CUSTOMER: "客户咨询",
  MEDIA: "媒体咨询",
  EVENT_ORGANIZER: "活动主办方",
};

const typeColors: Record<string, string> = {
  CUSTOMER: "bg-blue-50 text-blue-700",
  MEDIA: "bg-purple-50 text-purple-700",
  EVENT_ORGANIZER: "bg-amber-50 text-amber-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "待处理",
  FOLLOWING_UP: "跟进中",
  CONTACTED: "已联系",
  COMPLETED: "已完成",
  INVALID: "无效",
  SPAM: "垃圾信息",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  FOLLOWING_UP: "bg-blue-50 text-blue-700",
  CONTACTED: "bg-green-50 text-green-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  INVALID: "bg-red-50 text-red-700",
  SPAM: "bg-red-100 text-red-800",
};

const riskLevelLabels: Record<string, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  BLOCKED: "阻止",
};

const riskLevelColors: Record<string, string> = {
  LOW: "bg-green-50 text-green-700",
  MEDIUM: "bg-yellow-50 text-yellow-700",
  HIGH: "bg-orange-50 text-orange-700",
  BLOCKED: "bg-red-50 text-red-700",
};

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number | string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function ContactSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [pagination, setPagination] = useState<DataTablePaginationProps>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const loadSubmissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setPageError("");

      const url = new URL(
        "/api/admin/contact-submissions",
        window.location.origin
      );
      url.searchParams.set("page", page.toString());
      url.searchParams.set("pageSize", "20");
      if (keyword) url.searchParams.set("keyword", keyword);
      if (type) url.searchParams.set("type", type);
      if (status) url.searchParams.set("status", status);
      if (riskLevel) url.searchParams.set("riskLevel", riskLevel);

      const response = await fetch(url.toString());

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as ApiResponse;

      if (data.success && data.data) {
        setSubmissions(data.data.items);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "加载失败"
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, keyword, type, status, riskLevel]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  const stats = useMemo(
    () => ({
      total: pagination.total,
      pending: submissions.filter((s) => s.status === "PENDING").length,
      highRisk: submissions.filter((s) => s.riskLevel === "HIGH" || s.riskLevel === "BLOCKED").length,
      duplicate: submissions.filter((s) => s.isDuplicate).length,
    }),
    [submissions, pagination.total]
  );

  const columns: DataTableColumn<Submission>[] = useMemo(
    () => [
      {
        key: "contactName",
        label: "联系人",
        render: (submission) => (
          <Link
            href={`/admin/contact-submissions/${submission.id}`}
            className="text-blue-600 hover:underline font-medium"
          >
            {submission.contactName}
          </Link>
        ),
      },
      {
        key: "type",
        label: "类型",
        render: (submission) => (
          <span
            className={[
              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
              typeColors[submission.type] || "bg-slate-50 text-slate-700",
            ].join(" ")}
          >
            {typeLabels[submission.type]}
          </span>
        ),
      },
      {
        key: "company",
        label: "公司/媒体",
        render: (submission) => (
          <p className="text-sm text-slate-600">
            {submission.customerInquiry?.companyName ||
              submission.mediaInquiry?.mediaName ||
              submission.eventOrganizerInquiry?.organizerName ||
              "—"}
          </p>
        ),
      },
      {
        key: "email",
        label: "邮箱",
        render: (submission) => (
          <p className="text-sm text-slate-600">
            {submission.email || "—"}
          </p>
        ),
      },
      {
        key: "status",
        label: "状态",
        render: (submission) => (
          <span
            className={[
              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
              statusColors[submission.status] || "bg-slate-50 text-slate-700",
            ].join(" ")}
          >
            {statusLabels[submission.status]}
          </span>
        ),
      },
      {
        key: "riskLevel",
        label: "风险",
        render: (submission) => (
          <span
            className={[
              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
              riskLevelColors[submission.riskLevel] || "bg-slate-50 text-slate-700",
            ].join(" ")}
          >
            {riskLevelLabels[submission.riskLevel]}
          </span>
        ),
      },
      {
        key: "submittedAt",
        label: "提交时间",
        render: (submission) => (
          <p className="text-sm text-slate-600">
            {new Date(submission.submittedAt).toLocaleString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        ),
      },
      {
        key: "actions",
        label: "操作",
        className: "px-5 py-4 text-right",
        render: (submission) => (
          <Link
            href={`/admin/contact-submissions/${submission.id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            title="查看详情"
          >
            <Eye className="h-4 w-4" />
          </Link>
        ),
      },
    ],
    []
  );

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
      {/* 头部 */}
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
            <MessageSquare className="h-4 w-4" />
            业务管理
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            客户线索
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            管理通过联系表单提交的所有客户线索。支持按类型、状态、风险等级筛选和搜索。
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSubmissions()}
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={["h-4 w-4", isLoading ? "animate-spin" : ""].join(" ")}
          />
          刷新
        </button>
      </header>

      {/* 统计卡片 */}
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="总提交数"
          value={stats.total}
          description="所有联系表单提交"
        />
        <StatCard
          label="待处理"
          value={stats.pending}
          description="未处理的线索"
        />
        <StatCard
          label="高风险"
          value={stats.highRisk}
          description="需要特别关注"
        />
        <StatCard
          label="可能重复"
          value={stats.duplicate}
          description="疑似重复提交"
        />
      </section>

      {/* 筛选 */}
      <section className="mt-7 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-200 mb-4">
          <Filter className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-900">筛选条件</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <input
            type="text"
            placeholder="搜索联系人、邮箱、电话"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">所有类型</option>
            <option value="CUSTOMER">客户咨询</option>
            <option value="MEDIA">媒体咨询</option>
            <option value="EVENT_ORGANIZER">活动主办方</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">所有状态</option>
            <option value="PENDING">待处理</option>
            <option value="FOLLOWING_UP">跟进中</option>
            <option value="CONTACTED">已联系</option>
            <option value="COMPLETED">已完成</option>
          </select>

          <select
            value={riskLevel}
            onChange={(e) => {
              setRiskLevel(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">所有风险</option>
            <option value="LOW">低</option>
            <option value="MEDIUM">中</option>
            <option value="HIGH">高</option>
            <option value="BLOCKED">阻止</option>
          </select>

          <button
            onClick={() => {
              setKeyword("");
              setType("");
              setStatus("");
              setRiskLevel("");
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            重置
          </button>
        </div>
      </section>

      {/* 错误信息 */}
      {pageError && (
        <div className="mt-7 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {pageError}
        </div>
      )}

      {/* 加载中 */}
      {isLoading && (
        <div className="mt-7 flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-2 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm">加载中...</p>
          </div>
        </div>
      )}

      {/* 表格 */}
      {!isLoading && submissions.length > 0 && (
        <>
          <section className="mt-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {submissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className="hover:bg-slate-50 transition"
                    >
                      {columns.map((col) => (
                        <td
                          key={`${submission.id}-${col.key}`}
                          className="px-5 py-4 whitespace-nowrap"
                        >
                          {col.render(submission)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 分页 */}
          <div className="mt-7 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              共 {pagination.total} 条，第 {pagination.page} 页 / 共{" "}
              {pagination.totalPages} 页
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={!pagination.hasPreviousPage}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() =>
                  setPage(Math.min(pagination.totalPages, page + 1))
                }
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        </>
      )}

      {/* 无数据 */}
      {!isLoading && submissions.length === 0 && (
        <div className="mt-7 flex h-64 items-center justify-center rounded-xl border border-slate-200 border-dashed bg-slate-50">
          <div className="text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-600">
              暂无线索数据
            </p>
            <p className="mt-1 text-xs text-slate-500">
              尝试调整筛选条件
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
