"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  AlertCircle,
  Trash2,
} from "lucide-react";

type ContactSubmission = {
  id: string;
  type: string;
  locale: string;
  contactName: string;
  phone: string | null;
  email: string | null;
  status: string;
  riskLevel: string;
  riskReasons: string[];
  isDuplicate: boolean;
  duplicateOfId: string | null;
  notificationStatus: string;
  submittedAt: string;
  customerInquiry?: {
    companyName: string;
    mainBusiness: string;
    regionDetail: string;
    jobTitle: string | null;
    applicationType: string | null;
    productType: string | null;
    chemicalSystem: string | null;
    cellShape: string | null;
    specificScenario: string | null;
    unitPackCapacityKwh: number | null;
    unitPackVoltageV: number | null;
    spaceDimensions: string | null;
    annualElectricityKwh: number | null;
    chargingHours: number | null;
    otherRequirements: string | null;
  } | null;
  mediaInquiry?: {
    mediaName: string;
    inquiryPurpose: string | null;
    details: string;
  } | null;
  eventOrganizerInquiry?: {
    eventName: string;
    organizerName: string;
    location: string;
    startAt: string;
    endAt: string;
    inquiryPurpose: string | null;
    details: string;
  } | null;
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
  duplicateOf?: { id: string } | null;
  duplicates: Array<{ id: string }>;
};

const statusLabels: Record<string, string> = {
  PENDING: "待处理",
  FOLLOWING_UP: "跟进中",
  CONTACTED: "已联系",
  COMPLETED: "已完成",
  INVALID: "无效",
  SPAM: "垃圾信息",
};

const typeLabels: Record<string, string> = {
  CUSTOMER: "客户咨询",
  MEDIA: "媒体咨询",
  EVENT_ORGANIZER: "活动主办方",
};

const riskLevelLabels: Record<string, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  BLOCKED: "阻止",
};

const riskLevelColors: Record<string, string> = {
  LOW: "bg-green-50 text-green-700 border-green-200",
  MEDIUM: "bg-yellow-50 text-yellow-700 border-yellow-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  BLOCKED: "bg-red-50 text-red-700 border-red-200",
};

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-0 sm:px-0 sm:py-6">
      <dt className="text-sm font-medium text-slate-600">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">
        {value || "—"}
      </dd>
    </div>
  );
}

export default function ContactSubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [submission, setSubmission] = useState<ContactSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadSubmission = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/admin/contact-submissions/${id}`
        );

        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/admin/login");
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as {
          success: boolean;
          data?: ContactSubmission;
        };

        if (data.data) {
          setSubmission(data.data);
          setNewStatus(data.data.status);
        }
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSubmission();
  }, [id, router]);

  const handleStatusChange = async () => {
    if (!submission || newStatus === submission.status) return;

    try {
      const response = await fetch(
        `/api/admin/contact-submissions/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) throw new Error("更新失败");

      setSubmission((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
      alert("状态已更新");
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新状态失败");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsSubmittingNote(true);
    try {
      const response = await fetch(
        `/api/admin/contact-submissions/${id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newNote }),
        }
      );

      if (!response.ok) throw new Error("添加备注失败");

      const data = (await response.json()) as { success: boolean; data: any };

      setSubmission((prev) =>
        prev
          ? {
              ...prev,
              notes: [data.data, ...prev.notes],
            }
          : null
      );
      setNewNote("");
      alert("备注已添加");
    } catch (err) {
      alert(err instanceof Error ? err.message : "添加备注失败");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确认删除此记录？此操作可以恢复。")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/contact-submissions/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("删除失败");

      alert("删除成功");
      router.push("/admin/contact-submissions");
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-2 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <Link
          href="/admin/contact-submissions"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error || "提交不存在"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
      {/* 返回链接 */}
      <Link
        href="/admin/contact-submissions"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        返回列表
      </Link>

      {/* 标题 */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {submission.contactName}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {typeLabels[submission.type]} • ID: {submission.id}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* 主要内容 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 基本信息 */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              基本信息
            </h2>

            <dl className="divide-y divide-slate-100">
              <InfoItem
                label="提交类型"
                value={typeLabels[submission.type]}
              />
              <InfoItem
                label="提交语言"
                value={submission.locale === "zh" ? "中文" : "英文"}
              />
              <InfoItem label="联系电话" value={submission.phone} />
              <InfoItem label="联系邮箱" value={submission.email} />
              <InfoItem
                label="提交时间"
                value={new Date(
                  submission.submittedAt
                ).toLocaleString("zh-CN")}
              />
              <InfoItem
                label="邮件状态"
                value={submission.notificationStatus}
              />
            </dl>
          </section>

          {/* 业务信息 */}
          {submission.customerInquiry && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                客户信息
              </h2>

              <dl className="divide-y divide-slate-100">
                <InfoItem
                  label="公司名称"
                  value={submission.customerInquiry.companyName}
                />
                <InfoItem
                  label="主营业务"
                  value={submission.customerInquiry.mainBusiness}
                />
                <InfoItem
                  label="详细地址"
                  value={submission.customerInquiry.regionDetail}
                />
                {submission.customerInquiry.jobTitle && (
                  <InfoItem
                    label="职务"
                    value={submission.customerInquiry.jobTitle}
                  />
                )}
                {submission.customerInquiry.applicationType && (
                  <InfoItem
                    label="应用类型"
                    value={submission.customerInquiry.applicationType}
                  />
                )}
                {submission.customerInquiry.productType && (
                  <InfoItem
                    label="产品类型"
                    value={submission.customerInquiry.productType}
                  />
                )}
                {submission.customerInquiry.specificScenario && (
                  <InfoItem
                    label="应用场景"
                    value={submission.customerInquiry.specificScenario}
                  />
                )}
                {submission.customerInquiry.otherRequirements && (
                  <InfoItem
                    label="其他需求"
                    value={submission.customerInquiry.otherRequirements}
                  />
                )}
              </dl>
            </section>
          )}

          {submission.mediaInquiry && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                媒体信息
              </h2>

              <dl className="divide-y divide-slate-100">
                <InfoItem
                  label="媒体名称"
                  value={submission.mediaInquiry.mediaName}
                />
                {submission.mediaInquiry.inquiryPurpose && (
                  <InfoItem
                    label="来函目的"
                    value={submission.mediaInquiry.inquiryPurpose}
                  />
                )}
                <InfoItem
                  label="详细需求"
                  value={submission.mediaInquiry.details}
                />
              </dl>
            </section>
          )}

          {submission.eventOrganizerInquiry && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                活动信息
              </h2>

              <dl className="divide-y divide-slate-100">
                <InfoItem
                  label="活动名称"
                  value={submission.eventOrganizerInquiry.eventName}
                />
                <InfoItem
                  label="主办单位"
                  value={submission.eventOrganizerInquiry.organizerName}
                />
                <InfoItem
                  label="举办地点"
                  value={submission.eventOrganizerInquiry.location}
                />
                <InfoItem
                  label="开始时间"
                  value={new Date(
                    submission.eventOrganizerInquiry.startAt
                  ).toLocaleString("zh-CN")}
                />
                <InfoItem
                  label="结束时间"
                  value={new Date(
                    submission.eventOrganizerInquiry.endAt
                  ).toLocaleString("zh-CN")}
                />
                {submission.eventOrganizerInquiry.inquiryPurpose && (
                  <InfoItem
                    label="活动类型"
                    value={submission.eventOrganizerInquiry.inquiryPurpose}
                  />
                )}
                <InfoItem
                  label="活动详情"
                  value={submission.eventOrganizerInquiry.details}
                />
              </dl>
            </section>
          )}

          {/* 备注 */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              内部备注
            </h2>

            <div className="space-y-4">
              <div>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  maxLength={5000}
                  rows={3}
                  placeholder="添加新备注..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddNote}
                  disabled={isSubmittingNote || !newNote.trim()}
                  className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingNote ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      提交中
                    </>
                  ) : (
                    "添加备注"
                  )}
                </button>
              </div>

              {submission.notes.length > 0 && (
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  {submission.notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-sm text-slate-900">{note.content}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(note.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 状态 */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900 mb-4">处理状态</h3>

            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PENDING">待处理</option>
              <option value="FOLLOWING_UP">跟进中</option>
              <option value="CONTACTED">已联系</option>
              <option value="COMPLETED">已完成</option>
              <option value="INVALID">无效</option>
              <option value="SPAM">垃圾信息</option>
            </select>

            <button
              onClick={handleStatusChange}
              disabled={newStatus === submission.status}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              更新状态
            </button>
          </section>

          {/* 风险评估 */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900 mb-4">风险评估</h3>

            <div
              className={[
                "rounded-lg border px-4 py-3 mb-4",
                riskLevelColors[submission.riskLevel],
              ].join(" ")}
            >
              <p className="text-sm font-semibold">
                {riskLevelLabels[submission.riskLevel]}
              </p>
            </div>

            {(() => {
              const reasons = Array.isArray(submission.riskReasons)
                ? submission.riskReasons
                : typeof submission.riskReasons === "string"
                  ? JSON.parse(submission.riskReasons)
                  : [];
              return reasons.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    风险原因
                  </p>
                  <div className="space-y-2">
                    {reasons.map((reason: string) => (
                      <div
                        key={reason}
                        className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 px-2 py-1 rounded"
                      >
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-amber-600" />
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {submission.isDuplicate && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-900">
                  ⚠️ 可能为重复提交
                </p>
                {submission.duplicateOfId && (
                  <Link
                    href={`/admin/contact-submissions/${submission.duplicateOfId}`}
                    className="text-xs text-amber-700 hover:underline block mt-1"
                  >
                    查看原始记录
                  </Link>
                )}
              </div>
            )}

            {submission.duplicates.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-600 mb-2">
                  关联重复
                </p>
                <div className="space-y-1">
                  {submission.duplicates.map((dup) => (
                    <Link
                      key={dup.id}
                      href={`/admin/contact-submissions/${dup.id}`}
                      className="text-xs text-blue-600 hover:underline block"
                    >
                      {dup.id}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 操作 */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900 mb-4">操作</h3>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  删除中
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  删除此记录
                </>
              )}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
