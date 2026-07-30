import { notFound } from "next/navigation";

import CompanyHistoryForm from "@/components/admin/company-history/CompanyHistoryForm";
import { requireAdminActor } from "@/lib/admin-auth/require-admin-actor";
import { formatDateInput } from "@/lib/company-history/date";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeParagraphs(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export default async function EditCompanyHistoryPage({ params }: Props) {
  await requireAdminActor();

  const { id } = await params;

  const item = await prisma.companyHistoryItem.findUnique({
    where: { id },
    select: {
      id: true,
      locale: true,
      displayTime: true,
      sortDate: true,
      sortOrder: true,
      title: true,
      detailParagraphs: true,
      imageAssetId: true,
      imageAsset: {
        select: {
          id: true,
          url: true,
          width: true,
          height: true,
          alt: true,
        },
      },
    },
  });

  if (!item) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          Company History
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">编辑公司发展历程</h1>
        <p className="mt-1 text-sm text-slate-500">
          可修改内容语言、排序时间、排序值、详情自然段和图片。
        </p>
      </div>

      <CompanyHistoryForm
        mode="edit"
        initialData={{
          id: item.id,
          locale: item.locale,
          displayTime: item.displayTime,
          sortDate: formatDateInput(item.sortDate),
          sortOrder: item.sortOrder,
          title: item.title,
          detailParagraphs: normalizeParagraphs(item.detailParagraphs),
          imageAssetId: item.imageAssetId,
          imageAsset: item.imageAsset,
        }}
      />
    </main>
  );
}
